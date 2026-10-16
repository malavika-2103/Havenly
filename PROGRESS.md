# Havenly Progress

## Completed phases
- Phase 0: Environment (Windows, VS Code, Python 3.14, Git, PostgreSQL 18)
- Phase 1: Project setup
- Phase 2: Database schema + 17 synthetic Ernakulam properties

## Current phase
- Phase 3: Backend search service

## Files added in Phase 3
- app/backend/errors.py - structured HavenlyError (code, message, recovery)
- app/backend/models.py - Pydantic input/output models
- app/backend/search_service.py - hard filters (SQL) + soft ranking (review themes)
- scripts/demo_search.py - runs the Kochi example search
- tests/test_search.py - 26 search tests

## Search rules
- Hard filters (exclude): city, locality, rent range, accommodation type, room type,
  women_only (unknown status is excluded and reported), required amenities, mandatory cuisine.
- Soft preferences (rank only): quiet, privacy, cleanliness, food_quality, value_for_money,
  scored from resident review themes. Verified reviews weigh 1, unverified 0.5.
- Missing evidence scores 0 for that preference; no evidence at all = score unknown, ranked last.
- Ties: cheaper first, then property_id.
- commute_convenience accepted but ignored (no data yet).

## Commands that work
- python scripts\init_db.py
- python scripts\demo_search.py
- pytest

## Tests passed
- 36 total (verify on your machine)

## Known bugs
- None yet

## Next action
- Phase 4: MCP server + search_properties tool, tested with MCP Inspector
