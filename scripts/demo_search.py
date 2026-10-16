"""Run the Kochi example search straight against the backend (no MCP yet).

Run from the project folder:  python scripts\\demo_search.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.backend.models import SearchCriteria  # noqa: E402
from app.backend.search_service import search  # noqa: E402

criteria = SearchCriteria(
    city="Kochi",
    max_rent=9000,
    accommodation_type="PG",
    women_only=True,
    food_requirements={"cuisine": ["north_indian"], "mandatory": False},
    soft_preferences={"quiet": 1.0, "privacy": 0.8},
    limit=5,
)

response = search(criteria)
print("Request: women-only PG in Kochi, max Rs 9000, North Indian food, quiet + privacy\n")
print(f"{response.total_matching} properties passed the hard filters. Top {len(response.results)}:\n")

for i, r in enumerate(response.results, 1):
    score = "unknown" if r.score is None else f"{r.score:.2f}"
    print(f"{i}. {r.name} - {r.location.locality}  |  Rs {r.monthly_rent} ({r.room_type})  |  score {score}  |  {r.verification_status}")
    for label, items in [("matches", r.match_reasons), ("mismatches", r.mismatches),
                         ("conflicts", r.conflicting_reports), ("missing", r.missing_information)]:
        for item in items:
            print(f"     [{label}] {item}")
    print(f"     [sources] rent: {r.provenance['monthly_rent']}, food: {r.provenance['food']}")
    print()

meta = response.search_metadata
print("Hard filters:", ", ".join(meta.hard_filters_applied))
print("Excluded because unknown:", meta.excluded_because_unknown or "none")
