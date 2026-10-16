# Havenly

MCP-first, women-focused accommodation discovery and verification platform.
AI clients (e.g. ChatGPT) call Havenly's MCP tools; the backend and database are the source of truth.

## Tech stack
Python 3.11+, Pydantic, pytest. Coming next: PostgreSQL, Python MCP SDK, FastAPI.

## Folder structure
```
havenly/
  app/
    backend/      # business logic (search, ranking) - Phase 3
    db/           # schema + seed data - Phase 2
    mcp_server/   # MCP tools - Phase 4
  scripts/        # helper scripts
  tests/          # pytest tests
```

## Setup (Windows, VS Code terminal / PowerShell)
```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python scripts\check_setup.py
pytest
```

## Database
PostgreSQL 18. Create the database once (see PROGRESS.md), then build and seed it:
```powershell
python scripts\init_db.py
```
This **wipes and rebuilds** all tables every time.

Seed data: 17 **synthetic** Ernakulam/Kochi properties. Localities and landmarks are real, but all property names, prices, rules and reviews are invented. All verifications are simulated.

## Environment variables
See `.env.example`. Never commit `.env`.

## Known limitations
No backend search or MCP server yet. Seed data is fictional.
