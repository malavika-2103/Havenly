"""Phase 3 tests: the backend search service.

Uses the seeded database (run `python scripts\\init_db.py` first).
"""
import psycopg
import pytest
from pydantic import ValidationError

from app.backend import search_service
from app.backend.errors import HavenlyError
from app.backend.models import SearchCriteria
from app.backend.search_service import search
from app.db.connection import get_connection


@pytest.fixture(scope="module", autouse=True)
def require_db():
    try:
        get_connection().close()
    except Exception as exc:
        pytest.skip(f"Database not reachable: {exc}")


def names(response):
    return [r.name for r in response.results]


def kochi(**kwargs):
    base = {"city": "Kochi", "limit": 20}
    base.update(kwargs)
    return search(SearchCriteria(**base))


# ---------- hard filters ----------

def test_budget_is_never_exceeded():
    res = kochi(max_rent=6000)
    assert res.results
    assert all(r.monthly_rent <= 6000 for r in res.results)


def test_over_budget_property_excluded():
    assert "Coral Stay Women's PG" not in names(kochi(max_rent=9000))


def test_women_only_excludes_coed_and_unknown():
    res = kochi(women_only=True)
    assert "Harbour View PG" not in names(res)       # co-ed
    assert "The Nest Co-Living" not in names(res)    # not stated
    assert any("The Nest Co-Living" in x for x in res.search_metadata.excluded_because_unknown)


def test_accommodation_type_filter():
    assert all(r.property_type == "hostel" for r in kochi(accommodation_type="hostel").results)


def test_room_type_filter_reports_that_room():
    res = kochi(room_type="single", max_rent=9000)
    assert res.results
    assert all(r.room_type == "single" and r.monthly_rent <= 9000 for r in res.results)


def test_required_amenity():
    res = kochi(required_amenities=["ac"])
    assert res.results
    assert "Lotus Residency Ladies PG" not in names(res)  # AC explicitly not available


def test_mandatory_cuisine_excludes_others():
    res = kochi(food_requirements={"cuisine": ["north_indian"], "mandatory": True})
    assert "Bluebell Ladies PG" not in names(res)         # no food listed
    assert "Palm Grove Women's Hostel" not in names(res)  # Kerala food only


def test_city_alias_and_case():
    assert kochi().total_matching == search(SearchCriteria(city="ernakulam", limit=20)).total_matching
    assert search(SearchCriteria(city="  KOCHI ")).total_matching > 0


def test_other_city_not_mixed_in():
    assert "Aster Ladies Hostel" not in names(kochi())  # Aluva, not Kochi


# ---------- soft ranking ----------

def test_quiet_ranks_quiet_place_above_noisy():
    order = names(kochi(max_rent=9500, soft_preferences={"quiet": 1}))
    assert order.index("Lotus Residency Ladies PG") < order.index("Saffron Nest Ladies PG")


def test_soft_preferences_do_not_remove_results():
    plain = kochi(max_rent=9000).total_matching
    assert kochi(max_rent=9000, soft_preferences={"quiet": 1, "privacy": 1}).total_matching == plain


def test_unknown_score_is_not_treated_as_match():
    res = kochi(soft_preferences={"quiet": 1})
    amrita = next(r for r in res.results if r.name == "Amrita Homes PG")
    assert amrita.score is None
    assert "No resident reports about quiet environment" in amrita.missing_information
    assert names(res)[-1] == "Amrita Homes PG" or all(
        r.score is None for r in res.results[names(res).index("Amrita Homes PG"):])


def test_full_evidence_beats_partial_evidence():
    # Lotus has good reviews for quiet AND privacy; Tara only for quiet.
    res = kochi(max_rent=9000, soft_preferences={"quiet": 1, "privacy": 1})
    lotus = next(r for r in res.results if r.name == "Lotus Residency Ladies PG")
    tara = next(r for r in res.results if r.name == "Tara Working Women's PG")
    assert lotus.score > tara.score


def test_conflicting_reviews_are_flagged():
    res = kochi(soft_preferences={"quiet": 1})
    tulsi = next(r for r in res.results if r.name == "Tulsi Ladies PG")
    assert any("disagree" in c for c in tulsi.conflicting_reports)


def test_results_are_deterministic():
    a = names(kochi(soft_preferences={"privacy": 1}))
    b = names(kochi(soft_preferences={"privacy": 1}))
    assert a == b


# ---------- provenance & missing info ----------

def test_every_result_has_source_labels():
    valid = {"owner_listed", "independently_verified", "resident_reported", "unknown"}
    for r in kochi().results:
        assert set(r.provenance.values()) <= valid


def test_verified_rent_is_labelled():
    lotus = next(r for r in kochi(room_type="single").results if r.name == "Lotus Residency Ladies PG")
    assert lotus.provenance["monthly_rent"] == "independently_verified"
    assert lotus.verification_status == "partially_verified"


def test_missing_deposit_reported():
    amrita = next(r for r in kochi().results if r.name == "Amrita Homes PG")
    assert "Security deposit not stated" in amrita.missing_information


def test_cuisine_preference_mismatch():
    res = kochi(food_requirements={"cuisine": ["north_indian"]})
    palm = next(r for r in res.results if r.name == "Palm Grove Women's Hostel")
    assert any("North Indian" in m for m in palm.mismatches)


# ---------- invalid input, empty results, errors ----------

def test_empty_city_rejected():
    with pytest.raises(ValidationError):
        SearchCriteria(city="   ")


def test_negative_budget_rejected():
    with pytest.raises(ValidationError):
        SearchCriteria(city="Kochi", max_rent=-1)


def test_min_above_max_rejected():
    with pytest.raises(ValidationError):
        SearchCriteria(city="Kochi", min_rent=9000, max_rent=5000)


def test_weight_out_of_range_rejected():
    with pytest.raises(ValidationError):
        SearchCriteria(city="Kochi", soft_preferences={"quiet": 5})


def test_unsupported_preference_is_reported_not_crashing():
    res = kochi(soft_preferences={"commute_convenience": 1, "rooftop_view": 1})
    ignored = " ".join(res.search_metadata.unsupported_preferences_ignored)
    assert "commute_convenience" in ignored and "rooftop_view" in ignored


def test_no_results_gives_suggestions():
    res = kochi(max_rent=1000)
    assert res.total_matching == 0 and res.results == []
    assert res.search_metadata.suggestions


def test_database_failure_is_structured(monkeypatch):
    def broken():
        raise psycopg.OperationalError("simulated outage")
    monkeypatch.setattr(search_service, "get_connection", broken)
    with pytest.raises(HavenlyError) as err:
        kochi()
    assert err.value.code == "DATABASE_ERROR"
    assert "simulated" not in err.value.message  # internal details not leaked
