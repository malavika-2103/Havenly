"""Phase 2 tests: the seeded database contains what we expect.

Requires PostgreSQL running and `python scripts/init_db.py` run first.
"""
import pytest

from app.db.connection import get_connection, property_id_for
from app.db.seed_data import PROPERTIES

VALID_SOURCES = {"owner_listed", "independently_verified", "resident_reported", "unknown"}


@pytest.fixture(scope="module")
def cur():
    try:
        conn = get_connection()
    except Exception as exc:  # database not running / wrong password
        pytest.skip(f"Database not reachable: {exc}")
    with conn, conn.cursor() as c:
        yield c
    conn.close()


def scalar(cur, sql, params=None):
    cur.execute(sql, params)
    return cur.fetchone()[0]


def test_all_properties_loaded(cur):
    assert scalar(cur, "SELECT count(*) FROM properties") == len(PROPERTIES)


def test_all_records_marked_synthetic(cur):
    assert scalar(cur, "SELECT count(*) FROM properties WHERE is_synthetic = FALSE") == 0


def test_property_ids_are_stable(cur):
    pid = scalar(cur, "SELECT id FROM properties WHERE slug = 'kakkanad-lotus-residency'")
    assert pid == property_id_for("kakkanad-lotus-residency")


def test_every_rent_has_valid_source_label(cur):
    cur.execute("SELECT DISTINCT rent_source::text FROM room_options")
    labels = {row[0] for row in cur.fetchall()}
    assert labels <= VALID_SOURCES


def test_unknown_women_only_is_stored_as_null(cur):
    cur.execute("SELECT women_only, women_only_source::text FROM properties WHERE slug = 'kalamassery-nest-coliving'")
    assert cur.fetchone() == (None, "unknown")


def test_missing_curfew_is_absent_not_guessed(cur):
    count = scalar(
        cur,
        """SELECT count(*) FROM accommodation_rules r JOIN properties p ON p.id = r.property_id
           WHERE p.slug = 'palarivattom-amrita-homes' AND r.rule_type = 'curfew'""",
    )
    assert count == 0


def test_conflicting_food_reviews_exist(cur):
    cur.execute(
        """SELECT DISTINCT t.sentiment FROM review_themes t
           JOIN reviews r ON r.id = t.review_id JOIN properties p ON p.id = r.property_id
           WHERE p.slug = 'edappally-saffron-nest' AND t.theme = 'food'"""
    )
    assert {row[0] for row in cur.fetchall()} == {-1, 1}


def test_verifications_are_simulated(cur):
    assert scalar(cur, "SELECT count(*) FROM property_verifications WHERE verified_by NOT LIKE 'SIMULATED%'") == 0
