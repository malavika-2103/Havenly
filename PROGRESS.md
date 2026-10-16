# Havenly Progress

## Completed phases
- Phase 0: Environment (Windows, VS Code, Python 3.14, Git, PostgreSQL 18)
- Phase 1: Project setup (venv, packages, .gitignore, first commit)

## Current phase
- Phase 2: Database schema + Ernakulam seed data

## Files created / modified in Phase 2
- app/db/schema.sql - 11 tables + source_type enum
- app/db/seed_data.py - 17 synthetic Ernakulam/Kochi properties
- app/db/connection.py - DB connection + stable property IDs
- scripts/init_db.py - rebuilds and seeds the database
- tests/test_db.py - database tests
- requirements.txt - added psycopg

## Commands that work
- python scripts\check_setup.py
- python scripts\init_db.py
- pytest

## Tests passed
- Phase 1: 2 tests
- Phase 2: 8 database tests (verify on your machine)

## Known bugs
- None yet

## Next action
- Phase 3: backend search service (hard filters + soft ranking)
