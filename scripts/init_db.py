"""Create all tables and load the synthetic seed data.

Run from the project folder:  python scripts\\init_db.py
WARNING: this wipes and rebuilds the database every time.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.db.connection import get_connection, property_id_for  # noqa: E402
from app.db.seed_data import AMENITIES, PROPERTIES  # noqa: E402

SIMULATED_VERIFIER = "SIMULATED (demo data)"


def create_schema(cur) -> None:
    sql = (ROOT / "app" / "db" / "schema.sql").read_text(encoding="utf-8")
    cur.execute(sql)


def insert_seed(cur) -> None:
    cur.executemany("INSERT INTO amenities (code, name, category) VALUES (%s, %s, %s)", AMENITIES)

    for p in PROPERTIES:
        pid = property_id_for(p["slug"])
        women_only, women_src = p["women_only"]

        cur.execute(
            """INSERT INTO properties (id, slug, name, property_type, women_only, women_only_source, description)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (pid, p["slug"], p["name"], p["type"], women_only, women_src, p["description"]),
        )
        cur.execute(
            """INSERT INTO property_locations (property_id, city, locality, latitude, longitude)
               VALUES (%s, %s, %s, %s, %s)""",
            (pid, p["city"], p["locality"], p["lat"], p["lng"]),
        )
        for room_type, rent, rent_src, deposit, dep_src in p["rooms"]:
            cur.execute(
                """INSERT INTO room_options (property_id, room_type, monthly_rent, rent_source, deposit, deposit_source)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (pid, room_type, rent, rent_src, deposit, dep_src),
            )
        for label, amount, freq, src in p["costs"]:
            cur.execute(
                """INSERT INTO additional_costs (property_id, label, amount, frequency, source_type)
                   VALUES (%s, %s, %s, %s, %s)""",
                (pid, label, amount, freq, src),
            )
        for code, (available, src) in p["amenities"].items():
            cur.execute(
                """INSERT INTO property_amenities (property_id, amenity_code, available, source_type)
                   VALUES (%s, %s, %s, %s)""",
                (pid, code, available, src),
            )
        for cuisine, meals, veg_only, src in p["food"]:
            cur.execute(
                """INSERT INTO food_arrangements (property_id, cuisine, meals_per_day, vegetarian_only, source_type)
                   VALUES (%s, %s, %s, %s, %s)""",
                (pid, cuisine, meals, veg_only, src),
            )
        for rule_type, (value, src) in p["rules"].items():
            cur.execute(
                """INSERT INTO accommodation_rules (property_id, rule_type, value, source_type)
                   VALUES (%s, %s, %s, %s)""",
                (pid, rule_type, value, src),
            )
        for scope, verified_at in p["verifications"]:
            cur.execute(
                """INSERT INTO property_verifications (property_id, scope, verified_by, verified_at, evidence_ref)
                   VALUES (%s, %s, %s, %s, %s)""",
                (pid, scope, SIMULATED_VERIFIER, verified_at, f"internal:simulated:{p['slug']}:{scope}"),
            )
        for label, verified, rating, text, date, themes in p["reviews"]:
            cur.execute(
                """INSERT INTO reviews (property_id, reviewer_label, is_verified_resident, rating, review_text, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (pid, label, verified, rating, text, date),
            )
            review_id = cur.fetchone()[0]
            for theme, sentiment in themes.items():
                cur.execute(
                    "INSERT INTO review_themes (review_id, theme, sentiment) VALUES (%s, %s, %s)",
                    (review_id, theme, sentiment),
                )


def print_summary(cur) -> None:
    print("\nRow counts:")
    for table in ["properties", "property_locations", "room_options", "additional_costs", "amenities",
                  "property_amenities", "food_arrangements", "accommodation_rules",
                  "property_verifications", "reviews", "review_themes"]:
        cur.execute(f"SELECT count(*) FROM {table}")  # nosec B608 - hardcoded table list
        print(f"  {table:<24} {cur.fetchone()[0]}")

    print("\nAll properties (cheapest room each):")
    cur.execute(
        """SELECT p.name, l.locality, p.property_type, p.women_only, min(r.monthly_rent)
           FROM properties p
           JOIN property_locations l ON l.property_id = p.id
           JOIN room_options r ON r.property_id = p.id
           GROUP BY p.name, l.locality, p.property_type, p.women_only
           ORDER BY min(r.monthly_rent)"""
    )
    for name, locality, ptype, women_only, rent in cur.fetchall():
        wo = {True: "women-only", False: "co-ed", None: "unknown"}[women_only]
        print(f"  Rs {rent:>6}  {name:<32} {locality:<28} {ptype:<14} {wo}")


def main() -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            create_schema(cur)
            insert_seed(cur)
            print_summary(cur)
    print("\nOK: database created and seeded.")


if __name__ == "__main__":
    main()
