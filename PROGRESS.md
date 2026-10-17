# Havenly Progress

## Completed phases
- Phase 0: Environment (Windows, VS Code, Python 3.14, Git, PostgreSQL 18)
- Phase 1: Project setup
- Phase 2: Database schema + 17 synthetic Ernakulam properties
- Phase 3: Backend search service (36 tests)

## Current phase
- Phase 4: MCP server + search_properties

## Files added in Phase 4
- app/mcp_server/server.py - MCPServer (mcp SDK 2.3) exposing search_properties
- tests/test_mcp_server.py - 5 tests through a real MCP client

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
- python -m app.mcp_server.server  (http://127.0.0.1:8000/mcp)
- npx @modelcontextprotocol/inspector
- pytest

## Tests passed
- 54 total (41 functional + 13 security regression tests)

## Known bugs
- None open. Security pass (2026-10-17): fixed LIKE wildcard injection, unbounded input sizes (DB DoS), NUL bytes surfacing as DATABASE_ERROR; added statement and connect timeouts; pytest bumped to 9.0.3 (PYSEC-2026-1845).

## Next action
- Phase 5: get_property, get_reviews, compare_properties
