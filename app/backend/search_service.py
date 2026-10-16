"""Property search: hard filters in SQL, then soft-preference ranking in Python.

This module knows nothing about MCP. The MCP server (Phase 4) and an optional
website both call search() and get the same answer.
"""
from collections import defaultdict

import psycopg

from app.backend.errors import HavenlyError
from app.backend.models import (
    CITY_ALIASES, SOFT_PREFERENCE_THEMES, SOFT_PREFERENCES_WITHOUT_DATA,
    AdditionalCost, Location, ReviewSummary, SearchCriteria, SearchMetadata,
    SearchResponse, SearchResult,
)
from app.db.connection import get_connection

# A theme counts as "good" above this normalised score and "poor" below the next one.
GOOD = 0.6
POOR = 0.4
# Unverified reviews count half as much as verified-resident reviews.
UNVERIFIED_WEIGHT = 0.5
ALL_VERIFICATION_SCOPES = {"existence", "rent", "amenities", "food", "rules"}

PREFERENCE_LABELS = {
    "quiet": "quiet environment", "privacy": "privacy", "cleanliness": "cleanliness",
    "food_quality": "food quality", "value_for_money": "value for money",
}


def pretty(code: str) -> str:
    return code.replace("_", " ")


# ---------------- hard filters ----------------

def _where(c: SearchCriteria, city: str, women_clause: str | None) -> tuple[str, list]:
    clauses = ["lower(l.city) = %s"]
    params: list = [city]

    if c.locality:
        clauses.append("l.locality ILIKE %s")
        params.append(f"%{c.locality.strip()}%")
    if c.accommodation_type:
        clauses.append("p.property_type = %s")
        params.append(c.accommodation_type)
    if women_clause:
        clauses.append(women_clause)

    room = ["r.property_id = p.id"]
    if c.room_type:
        room.append("r.room_type = %s")
        params.append(c.room_type)
    if c.max_rent is not None:
        room.append("r.monthly_rent <= %s")
        params.append(c.max_rent)
    if c.min_rent is not None:
        room.append("r.monthly_rent >= %s")
        params.append(c.min_rent)
    clauses.append(f"EXISTS (SELECT 1 FROM room_options r WHERE {' AND '.join(room)})")

    for amenity in c.required_amenities:
        clauses.append("EXISTS (SELECT 1 FROM property_amenities a WHERE a.property_id = p.id "
                       "AND a.amenity_code = %s AND a.available)")
        params.append(amenity.strip().lower())

    if c.food_requirements and c.food_requirements.mandatory and c.food_requirements.cuisine:
        clauses.append("EXISTS (SELECT 1 FROM food_arrangements f WHERE f.property_id = p.id AND f.cuisine = ANY(%s))")
        params.append(c.food_requirements.cuisine)

    return " AND ".join(clauses), params


def _filters_applied(c: SearchCriteria) -> list[str]:
    applied = ["city"]
    for name in ["locality", "min_rent", "max_rent", "accommodation_type", "room_type"]:
        if getattr(c, name) is not None:
            applied.append(name)
    if c.women_only:
        applied.append("women_only")
    if c.required_amenities:
        applied.append("required_amenities")
    if c.food_requirements and c.food_requirements.mandatory and c.food_requirements.cuisine:
        applied.append("food_cuisine (mandatory)")
    return applied


# ---------------- loading details ----------------

def _load_details(cur, ids: list) -> dict:
    """Fetch everything needed to build results for the given property IDs, in a few queries."""
    d = {k: defaultdict(list) for k in ["rooms", "costs", "amenities", "food", "verifications", "themes", "ratings"]}

    cur.execute("SELECT property_id, room_type, monthly_rent, rent_source::text, deposit, deposit_source::text "
                "FROM room_options WHERE property_id = ANY(%s) ORDER BY monthly_rent", (ids,))
    for row in cur.fetchall():
        d["rooms"][row[0]].append(row[1:])

    cur.execute("SELECT property_id, label, amount, frequency, source_type::text FROM additional_costs "
                "WHERE property_id = ANY(%s) ORDER BY id", (ids,))
    for row in cur.fetchall():
        d["costs"][row[0]].append(row[1:])

    cur.execute("SELECT property_id, amenity_code, available, source_type::text FROM property_amenities "
                "WHERE property_id = ANY(%s)", (ids,))
    for row in cur.fetchall():
        d["amenities"][row[0]].append(row[1:])

    cur.execute("SELECT property_id, cuisine, meals_per_day, source_type::text FROM food_arrangements "
                "WHERE property_id = ANY(%s) ORDER BY id", (ids,))
    for row in cur.fetchall():
        d["food"][row[0]].append(row[1:])

    cur.execute("SELECT property_id, scope FROM property_verifications WHERE property_id = ANY(%s)", (ids,))
    for pid, scope in cur.fetchall():
        d["verifications"][pid].append(scope)

    cur.execute("SELECT r.property_id, t.theme, t.sentiment, r.is_verified_resident FROM review_themes t "
                "JOIN reviews r ON r.id = t.review_id WHERE r.property_id = ANY(%s)", (ids,))
    for pid, theme, sentiment, verified in cur.fetchall():
        d["themes"][pid].append((theme, sentiment, verified))

    cur.execute("SELECT property_id, rating, is_verified_resident FROM reviews WHERE property_id = ANY(%s)", (ids,))
    for pid, rating, verified in cur.fetchall():
        d["ratings"][pid].append((rating, verified))

    return d


# ---------------- soft preference evaluation ----------------

def _theme_score(entries: list) -> tuple[float | None, int, bool]:
    """Weighted average of review sentiment for one theme, mapped to 0-1.

    Returns (score or None if no reports, number of reports, whether reports conflict).
    """
    if not entries:
        return None, 0, False
    total = weight_sum = 0.0
    for sentiment, verified in entries:
        w = 1.0 if verified else UNVERIFIED_WEIGHT
        total += w * sentiment
        weight_sum += w
    score = (total / weight_sum + 1) / 2  # -1..1  ->  0..1
    sentiments = {s for s, _ in entries}
    conflicting = 1 in sentiments and -1 in sentiments
    return round(score, 3), len(entries), conflicting


def _build_result(row, c: SearchCriteria, d: dict, prefs: dict[str, float]) -> SearchResult:
    pid, name, ptype, women_only, women_src, synthetic, city, locality = row
    reasons, mismatches, missing, conflicts = [], [], [], []

    # Cheapest room that satisfies the room/rent hard filters.
    rooms = [r for r in d["rooms"][pid]
             if (c.room_type is None or r[0] == c.room_type)
             and (c.max_rent is None or r[1] <= c.max_rent)
             and (c.min_rent is None or r[1] >= c.min_rent)]
    room_type, rent, rent_src, deposit, deposit_src = rooms[0]

    # --- reasons from hard filters ---
    if c.max_rent is not None:
        reasons.append(f"Within budget: Rs {rent} for a {room_type} room (limit Rs {c.max_rent})")
    if c.women_only:
        reasons.append(f"Women-only ({pretty(women_src)})")
    if c.room_type:
        reasons.append(f"{c.room_type.capitalize()} room available")
    for amenity in c.required_amenities:
        reasons.append(f"Has {pretty(amenity)}")
    if deposit is None:
        missing.append("Security deposit not stated")

    # --- food ---
    food = d["food"][pid]
    cuisines = {f[0] for f in food}
    if c.food_requirements and c.food_requirements.cuisine:
        for want in c.food_requirements.cuisine:
            if want in cuisines:
                reasons.append(f"{pretty(want).title()} food listed")
            elif not food:
                missing.append("Food arrangement not listed")
            else:
                mismatches.append(f"{pretty(want).title()} food not listed (offers: {', '.join(pretty(x) for x in sorted(cuisines))})")
    if food and any(f[1] is None for f in food):
        missing.append("Meals per day not stated")

    # --- soft preferences from review themes ---
    themes_by_name = defaultdict(list)
    for theme, sentiment, verified in d["themes"][pid]:
        themes_by_name[theme].append((sentiment, verified))

    weighted, weight_total = 0.0, 0.0
    for pref, weight in prefs.items():
        label = PREFERENCE_LABELS[pref]
        score, n, conflicting = _theme_score(themes_by_name[SOFT_PREFERENCE_THEMES[pref]])
        if score is None:
            missing.append(f"No resident reports about {label}")
            continue
        weighted += weight * score
        weight_total += weight
        if conflicting:
            conflicts.append(f"Residents disagree about {label} ({n} reports)")
        elif score >= GOOD:
            reasons.append(f"Residents report good {label} ({n} report{'s' if n > 1 else ''})")
        elif score <= POOR:
            mismatches.append(f"Residents report poor {label} ({n} report{'s' if n > 1 else ''})")
        else:
            conflicts.append(f"Mixed reports about {label} ({n} reports)")
    # Divide by ALL requested weights, so a preference with no evidence earns 0 instead of
    # being silently skipped. Missing information must never count as a match.
    requested = sum(prefs.values())
    final_score = round(weighted / requested, 3) if weight_total else None

    # --- provenance ---
    amenity_sources = {a[2] for a in d["amenities"][pid] if a[1]}
    if not amenity_sources:
        amenities_src = "unknown"
    elif amenity_sources == {"independently_verified"}:
        amenities_src = "independently_verified"
    else:
        amenities_src = "owner_listed"
    provenance = {
        "monthly_rent": rent_src,
        "deposit": deposit_src,
        "women_only": women_src,
        "amenities": amenities_src,
        "food": food[0][2] if food else "unknown",
    }

    # --- verification ---
    scopes = sorted(set(d["verifications"][pid]))
    if not scopes:
        status = "unverified"
    elif set(scopes) >= ALL_VERIFICATION_SCOPES:
        status = "verified"
    else:
        status = "partially_verified"

    # --- review summary ---
    ratings = d["ratings"][pid]
    rated = [r for r, _ in ratings if r is not None]
    summary = ReviewSummary(
        average_rating=round(sum(rated) / len(rated), 2) if rated else None,
        review_count=len(ratings),
        verified_resident_count=sum(1 for _, v in ratings if v),
    )
    if not ratings:
        missing.append("No resident reviews yet")

    costs = [AdditionalCost(label=l, amount=a, frequency=f, source_type=s) for l, a, f, s in d["costs"][pid]]
    for cost in costs:
        if cost.amount is None:
            missing.append(f"{cost.label} amount not stated")

    return SearchResult(
        property_id=str(pid), name=name, location=Location(city=city, locality=locality),
        property_type=ptype, monthly_rent=rent, room_type=room_type, deposit=deposit,
        additional_costs=costs, score=final_score,
        match_reasons=reasons, mismatches=mismatches,
        missing_information=list(dict.fromkeys(missing)),  # remove duplicates, keep order
        conflicting_reports=conflicts, provenance=provenance,
        verification_status=status, verified_scopes=scopes,
        review_summary=summary, is_synthetic=synthetic,
    )


def _sort_key(r: SearchResult):
    # 1) properties with a known score first, 2) higher score first,
    # 3) cheaper first, 4) property_id - so equal results always come out in the same order.
    return (r.score is None, -(r.score or 0), r.monthly_rent, r.property_id)


def _suggestions(c: SearchCriteria) -> list[str]:
    tips = []
    if c.max_rent is not None:
        tips.append(f"Try a higher max_rent than Rs {c.max_rent}")
    if c.locality:
        tips.append("Remove the locality to search the whole city")
    if c.room_type:
        tips.append("Allow other room types")
    if c.accommodation_type:
        tips.append("Allow other accommodation types")
    if c.required_amenities:
        tips.append("Make some required amenities optional")
    if c.food_requirements and c.food_requirements.mandatory:
        tips.append("Make the cuisine a preference instead of mandatory")
    return tips or ["No properties are listed in this city yet"]


# ---------------- public entry point ----------------

def search(criteria: SearchCriteria) -> SearchResponse:
    city = criteria.city.lower()
    city = CITY_ALIASES.get(city, city)

    prefs = {k: w for k, w in criteria.soft_preferences.items() if k in SOFT_PREFERENCE_THEMES and w > 0}
    ignored = []
    for k in criteria.soft_preferences:
        if k in SOFT_PREFERENCES_WITHOUT_DATA:
            ignored.append(f"{k} (no data available yet)")
        elif k not in SOFT_PREFERENCE_THEMES:
            ignored.append(f"{k} (not a supported preference)")

    women_clause = "p.women_only IS TRUE" if criteria.women_only else None
    where, params = _where(criteria, city, women_clause)

    try:
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(
                f"""SELECT p.id, p.name, p.property_type, p.women_only, p.women_only_source::text,
                           p.is_synthetic, l.city, l.locality
                    FROM properties p JOIN property_locations l ON l.property_id = p.id
                    WHERE {where}""",
                params,
            )
            rows = cur.fetchall()

            excluded = []
            if criteria.women_only:
                # Tell the user about places that might qualify but don't state women-only status.
                unk_where, unk_params = _where(criteria, city, "p.women_only IS NULL")
                cur.execute(f"SELECT p.name FROM properties p JOIN property_locations l "
                            f"ON l.property_id = p.id WHERE {unk_where} ORDER BY p.name", unk_params)
                excluded = [f"{n} (women-only status not stated)" for (n,) in cur.fetchall()]

            details = _load_details(cur, [r[0] for r in rows]) if rows else {}
    except psycopg.Error as exc:
        raise HavenlyError("DATABASE_ERROR", "The accommodation database is unavailable.",
                           recovery="Try again later.") from exc

    results = sorted((_build_result(r, criteria, details, prefs) for r in rows), key=_sort_key)

    metadata = SearchMetadata(
        hard_filters_applied=_filters_applied(criteria),
        soft_preferences_evaluated=list(prefs),
        unsupported_preferences_ignored=ignored,
        excluded_because_unknown=excluded,
        suggestions=[] if results else _suggestions(criteria),
    )
    return SearchResponse(results=results[: criteria.limit], total_matching=len(results), search_metadata=metadata)
