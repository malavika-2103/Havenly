# Havenly

Havenly is an MCP-first accommodation discovery and verification platform focused on women looking for PGs, hostels and shared rentals. AI clients (for example ChatGPT, Claude, or the MCP Inspector) call Havenly's MCP tools. The backend and the PostgreSQL database are the single source of truth; the AI client only relays what the tools return.

Every fact Havenly returns carries a source label, missing information is reported instead of guessed, and Havenly never claims that a place is "safe".

> **Demo data notice:** the current database holds 17 synthetic properties in Ernakulam/Kochi. Localities and landmarks are real, but every property name, price, rule and review is invented, and every verification is simulated.

---

## Contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Database](#database)
8. [Running the MCP server](#running-the-mcp-server)
9. [Using the MCP Inspector (local UI)](#using-the-mcp-inspector-local-ui)
10. [Connecting an AI client](#connecting-an-ai-client)
11. [Tool reference: search_properties](#tool-reference-search_properties)
12. [Search and ranking rules](#search-and-ranking-rules)
13. [Error handling](#error-handling)
14. [Testing](#testing)
15. [Security](#security)
16. [Helper scripts](#helper-scripts)
17. [Troubleshooting](#troubleshooting)
18. [Known limitations](#known-limitations)
19. [Roadmap](#roadmap)
20. [Team](#team)

---

## Architecture

```
AI client (ChatGPT, Claude, MCP Inspector)
        |
        |  MCP (Streamable HTTP on 127.0.0.1:8000/mcp, or stdio)
        v
app/mcp_server/server.py      Validates tool arguments, maps errors, no business logic
        |
        v
app/backend/search_service.py Hard filters in SQL, soft-preference ranking in Python
        |
        v
app/db/connection.py          psycopg 3 connection from DATABASE_URL
        |
        v
PostgreSQL 18                 Schema in app/db/schema.sql, seed in app/db/seed_data.py
```

Design principles:

- **Separation of layers.** The MCP server only translates between MCP and the backend. The backend knows nothing about MCP, so a future website or REST API can call the same `search()` function and get identical results.
- **Provenance everywhere.** Important facts (rent, deposit, women-only status, amenities, food) carry one of four source labels: `owner_listed`, `independently_verified`, `resident_reported`, `unknown`.
- **Unknown is never a match.** Missing data is listed in `missing_information` and never counts in a property's favour.
- **Deterministic output.** The same request always returns results in the same order.

## Tech stack

| Area | Technology |
| --- | --- |
| Language | Python 3.11 or newer (developed on 3.14) |
| Validation | Pydantic 2 |
| Database | PostgreSQL 18, accessed with psycopg 3 (binary build) |
| MCP | Official MCP Python SDK 2.x (`MCPServer`, Streamable HTTP and stdio) |
| Config | python-dotenv |
| Tests | pytest 9 |

## Project structure

```
havenly/
  app/
    backend/
      errors.py           HavenlyError: structured error with code, message, recovery, details
      models.py           Pydantic input (SearchCriteria) and output (SearchResponse) models, input limits
      search_service.py   search(): SQL hard filters, review-theme ranking, provenance, verification status
    db/
      connection.py       get_connection(), stable property IDs (UUIDv5 from slug)
      schema.sql          Full schema (drops and recreates all tables)
      seed_data.py        17 synthetic Ernakulam/Kochi properties
    mcp_server/
      server.py           MCP server exposing the search_properties tool
  scripts/
    check_setup.py        Verifies Python version, virtual env and packages
    init_db.py            Wipes, recreates and seeds the database
    demo_search.py        Runs an example search directly against the backend
  tests/
    test_setup.py         Environment checks
    test_db.py            Seed data integrity
    test_search.py        Backend search behaviour, validation and input-security checks
    test_mcp_server.py    End-to-end tool calls through a real in-process MCP client
  .env.example            Template for local configuration
  requirements.txt        Python dependencies
  PROGRESS.md             Phase-by-phase progress log
```

## Prerequisites

- Windows 10/11 (commands below use PowerShell; macOS/Linux equivalents work the same way)
- Python 3.11 or newer (`py -3 --version`)
- PostgreSQL 18 running locally
- Node.js 22.19 or newer (only for the MCP Inspector)
- Git

## Installation

```powershell
git clone <repository-url> havenly
cd havenly
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python scripts\check_setup.py
```

If PowerShell refuses to run `Activate.ps1`, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or call the interpreter directly with `.\.venv\Scripts\python.exe`.

## Configuration

All configuration is read from environment variables, loaded from a `.env` file in the project root.

| Variable | Required | Description |
| --- | --- | --- |
| `APP_ENV` | No | Environment name, e.g. `development`. Shown by `check_setup.py`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://havenly:<password>@localhost:5432/havenly` |
| `MCP_AUTH_TOKEN` | No | Reserved for future MCP authentication. Not used yet. |

`.env` is listed in `.gitignore`. Never commit it, and never put real credentials in `.env.example`.

## Database

### One-time setup

Create a dedicated role and database (run in `psql` as the `postgres` superuser, choosing your own password):

```sql
CREATE ROLE havenly WITH LOGIN PASSWORD '<your-password>';
CREATE DATABASE havenly OWNER havenly;
```

Put the same password in `DATABASE_URL` in `.env`.

### Build and seed

```powershell
python scripts\init_db.py
```

This **drops and recreates every table** and loads the seed data, then prints row counts and a property summary. Run it any time you want a clean database. Property IDs are UUIDv5 values derived from each property's slug, so they stay the same across re-seeds.

### Schema overview

| Table | Purpose |
| --- | --- |
| `properties` | One row per accommodation: name, type (`PG`, `hostel`, `shared_rental`), women-only flag (NULL = unknown) with source, synthetic flag |
| `property_locations` | City, locality, coordinates |
| `room_options` | Room types (`single`, `double`, `triple`, `dormitory`) with rent and deposit, each with its own source label |
| `additional_costs` | Extra charges (electricity, admission fee, ...), amount NULL if unknown |
| `amenities` / `property_amenities` | Amenity catalogue, and per-property availability with source (FALSE = explicitly not available) |
| `food_arrangements` | One row per cuisine with meals per day and source |
| `accommodation_rules` | Curfew, visitors, overnight guests, cooking, smoking/alcohol. A missing rule means unknown. |
| `property_verifications` | Scopes Havenly has checked (`existence`, `rent`, `amenities`, `food`, `rules`). `evidence_ref` is private and never returned by tools. Verification is not proof of safety. |
| `reviews` / `review_themes` | Resident reviews and the themes they mention (`food`, `privacy`, `noise`, `cleanliness`, `safety`, `maintenance`, `management`, `value`) with sentiment -1, 0 or 1 |

The custom enum `source_type` holds the four provenance labels.

### Seed data

`app/db/seed_data.py` contains 16 properties in Kochi and 1 in Aluva. It deliberately includes edge cases used by the tests: missing food data, unstated women-only status, missing curfew rules, unknown deposits, properties with no reviews, conflicting reviews, and properties that hard filters must exclude (over budget, co-ed, wrong type, wrong city).

## Running the MCP server

```powershell
python -m app.mcp_server.server                 # Streamable HTTP at http://127.0.0.1:8000/mcp
python -m app.mcp_server.server --port 8100     # different port
python -m app.mcp_server.server --stdio         # stdio, for clients that launch the server themselves
```

The HTTP server binds to `127.0.0.1` only, so it is reachable from this computer and nowhere else. Stop it with `Ctrl+C`.

## Using the MCP Inspector (local UI)

Havenly does not have its own web frontend yet. The MCP Inspector is the browser UI used to explore and call the tools locally.

1. Start the MCP server in one terminal: `python -m app.mcp_server.server`
2. In a second terminal: `npx @modelcontextprotocol/inspector`
3. The Inspector opens in your browser (by default `http://localhost:6274`, with a session token in the URL).
4. Choose transport **Streamable HTTP**, enter `http://127.0.0.1:8000/mcp`, click **Connect**.
5. Open **Tools**, click **List Tools**, select `search_properties`, fill in arguments and click **Run Tool**.

## Connecting an AI client

Any MCP client that supports Streamable HTTP can connect to `http://127.0.0.1:8000/mcp`. For clients that launch servers over stdio (for example Claude Desktop), use a configuration like:

```json
{
  "mcpServers": {
    "havenly": {
      "command": "C:\\path\\to\\havenly\\.venv\\Scripts\\python.exe",
      "args": ["-m", "app.mcp_server.server", "--stdio"],
      "cwd": "C:\\path\\to\\havenly"
    }
  }
}
```

Remote clients such as ChatGPT need a public HTTPS URL. Do not expose the server publicly until authentication is added (see [Security](#security)).

The server sends instructions to the client telling the model to state only facts from tool results, cite each fact's source, mention missing and conflicting information, never call a place safe, and disclose that the data is synthetic.

## Tool reference: search_properties

Read-only, idempotent, closed-world search over the accommodation database.

### Arguments

| Argument | Type | Required | Description |
| --- | --- | --- | --- |
| `city` | string (max 100 chars) | Yes | City name. `Ernakulam` and `Cochin` map to Kochi; `Bangalore` maps to Bengaluru. Case-insensitive. |
| `locality` | string (max 100 chars) | No | Area within the city, partial match, e.g. `Kakkanad` |
| `max_rent` | integer >= 0 | No | Monthly rent ceiling in rupees (hard filter) |
| `min_rent` | integer >= 0 | No | Monthly rent floor in rupees. Must not exceed `max_rent`. |
| `accommodation_type` | `PG` / `hostel` / `shared_rental` | No | Hard filter |
| `room_type` | `single` / `double` / `triple` / `dormitory` | No | Hard filter |
| `women_only` | boolean | No | `true` returns only places explicitly listed as women-only |
| `required_amenities` | list of strings (max 20) | No | Must-have amenity codes: `wifi`, `laundry`, `housekeeping`, `ac`, `hot_water`, `attached_bathroom`, `study_table`, `power_backup`, `water_purifier`, `kitchen_access`, `parking`, `fridge`, `cctv`, `security_guard`, `biometric_entry`, `gym` |
| `food_requirements` | object | No | `{"cuisine": ["north_indian"], "mandatory": false}`. Up to 20 cuisines. `mandatory: true` excludes places without any of them. |
| `soft_preferences` | object | No | Weights from 0 to 1 for `quiet`, `privacy`, `cleanliness`, `food_quality`, `value_for_money`, `commute_convenience`. They rank results but never exclude them. |
| `limit` | integer 1-20 | No | Maximum results, default 10 |

### Example request

```json
{
  "city": "Kochi",
  "max_rent": 9000,
  "accommodation_type": "PG",
  "women_only": true,
  "food_requirements": {"cuisine": ["north_indian"], "mandatory": false},
  "soft_preferences": {"quiet": 1, "privacy": 0.8},
  "limit": 5
}
```

### Response shape

```json
{
  "results": [
    {
      "property_id": "uuid",
      "name": "Lotus Residency Ladies PG",
      "location": {"city": "Kochi", "locality": "Kakkanad"},
      "property_type": "PG",
      "monthly_rent": 5200,
      "room_type": "triple",
      "deposit": 10400,
      "additional_costs": [{"label": "Electricity (sub-meter)", "amount": null, "frequency": "usage_based", "source_type": "owner_listed"}, {"label": "Admission fee", "amount": 1000, "frequency": "one_time", "source_type": "owner_listed"}],
      "score": 1.0,
      "match_reasons": ["Within budget: Rs 5200 for a triple room (limit Rs 9000)", "..."],
      "mismatches": [],
      "missing_information": ["Electricity (sub-meter) amount not stated"],
      "conflicting_reports": [],
      "provenance": {"monthly_rent": "owner_listed", "deposit": "owner_listed", "women_only": "owner_listed", "amenities": "owner_listed", "food": "owner_listed"},
      "verification_status": "partially_verified",
      "verified_scopes": ["existence", "rent"],
      "review_summary": {"average_rating": 4.33, "review_count": 3, "verified_resident_count": 2},
      "is_synthetic": true
    }
  ],
  "total_matching": 10,
  "search_metadata": {
    "hard_filters_applied": ["city", "max_rent", "accommodation_type", "women_only"],
    "soft_preferences_evaluated": ["quiet", "privacy"],
    "unsupported_preferences_ignored": [],
    "excluded_because_unknown": [],
    "suggestions": []
  }
}
```

Field notes:

- `monthly_rent` and `room_type` describe the cheapest room that satisfies the rent and room-type filters.
- `score` is between 0 and 1, or `null` when there is no resident evidence for any requested preference.
- `verification_status` is `verified` (all five scopes), `partially_verified` (some) or `unverified` (none).
- `total_matching` counts all properties that passed the hard filters, even if `limit` cut the list.
- `suggestions` is filled only when there are no results, with hints on which filters to relax.

## Search and ranking rules

**Hard filters** (exclude properties): city, locality, rent range, accommodation type, room type, women-only, required amenities, mandatory cuisine. With `women_only: true`, properties whose status is unknown are excluded and listed in `excluded_because_unknown`.

**Soft preferences** (rank only):

| Preference | Review theme used |
| --- | --- |
| `quiet` | `noise` |
| `privacy` | `privacy` |
| `cleanliness` | `cleanliness` |
| `food_quality` | `food` |
| `value_for_money` | `value` |
| `commute_convenience` | accepted but ignored, no data yet |

Scoring:

1. For each requested preference, review sentiments for its theme are averaged. Verified-resident reviews weigh 1.0, unverified reviews 0.5. The average (-1 to 1) is mapped to 0-1.
2. A theme score of 0.6 or more is reported as a match reason, 0.4 or less as a mismatch, anything between as mixed. Reviews with both positive and negative sentiment are reported in `conflicting_reports`.
3. The property score is the weighted sum of theme scores divided by the sum of **all** requested weights, so a preference with no evidence contributes 0 rather than being skipped.
4. Properties with no evidence for any requested preference get `score: null` and rank after all scored properties.
5. Ties break by lower rent, then by `property_id`, so results are deterministic.

## Error handling

Errors are returned as MCP tool errors whose text contains a JSON object:

```json
{"error": {"code": "INVALID_ARGUMENT", "message": "Invalid search arguments.", "recovery": "Fix the listed fields and call the tool again.", "details": {"problems": ["max_rent: Input should be greater than or equal to 0"]}}}
```

| Code | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | Arguments failed validation (empty city, negative rent, `min_rent > max_rent`, weights outside 0-1, oversized input, control characters). `details.problems` lists each field. |
| `DATABASE_ERROR` | The database is unreachable or the query failed or timed out. Internal error details are never exposed. |

Searches that match nothing are **not** errors: they return an empty `results` list with `suggestions`.

## Testing

PostgreSQL must be running and seeded (`python scripts\init_db.py`) for the database, search and MCP tests. Without a database those tests are skipped, not failed.

```powershell
pytest            # full suite
pytest -q         # compact output
pytest tests\test_search.py -k budget   # a subset
```

The suite has 54 tests:

| File | Covers |
| --- | --- |
| `test_setup.py` | Python version and package imports |
| `test_db.py` | Seed integrity: counts, synthetic flags, stable IDs, source labels, deliberate gaps and conflicts |
| `test_search.py` | Hard filters, ranking, provenance, missing information, validation, structured database errors, LIKE-wildcard escaping, SQL-injection attempts, input size and control-character limits |
| `test_mcp_server.py` | Tool discovery and schema, real searches through an MCP client, structured error payloads, empty results, oversized and malformed input |

## Security

Current protections:

- **SQL injection:** every user value is passed as a bound `%s` parameter. Only fixed, code-defined clauses are joined into SQL strings (those lines carry `# nosec B608` comments for bandit).
- **LIKE wildcards:** `%`, `_` and `\` in `locality` are escaped, so they match literally.
- **Input limits:** text fields are capped at 100 characters, lists and preference maps at 20 entries, and duplicates are removed. This stops a single call from building an oversized query.
- **Control characters:** NUL and other control characters are rejected as `INVALID_ARGUMENT` instead of reaching PostgreSQL.
- **Query timeout:** each search runs with a 5-second `statement_timeout`; connections time out after 10 seconds.
- **Error hygiene:** database errors are replaced with a generic `DATABASE_ERROR`, and unexpected exceptions are masked by the MCP SDK.
- **Network exposure:** the HTTP server binds to `127.0.0.1` only, and the MCP SDK automatically enables DNS-rebinding protection (Host and Origin checks) for localhost.
- **Private data:** `evidence_ref` and reviewer text are never returned by tools.
- **Secrets:** `.env` is git-ignored; `.env.example` holds placeholders only.

Recommended checks before each release:

```powershell
pip install pip-audit bandit
pip-audit -r requirements.txt
bandit -q -r app scripts
pytest
```

Not yet implemented (required before any public deployment): authentication on the MCP endpoint (`MCP_AUTH_TOKEN` is reserved for this), rate limiting, HTTPS termination, and a least-privilege read-only database role for the MCP server.

## Helper scripts

| Command | Purpose |
| --- | --- |
| `python scripts\check_setup.py` | Confirms Python 3.11+, the virtual environment, packages, and `.env` loading |
| `python scripts\init_db.py` | Rebuilds and seeds the database (destructive) |
| `python scripts\demo_search.py` | Runs the example Kochi search and prints ranked results with reasons and sources |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `DATABASE_URL is not set` | Copy `.env.example` to `.env` and fill it in. |
| Tests show `skipped` | PostgreSQL is not reachable. Start the `postgresql-x64-18` service and check `DATABASE_URL`. |
| `password authentication failed` | The password in `DATABASE_URL` does not match the `havenly` role. |
| `relation "properties" does not exist` | Run `python scripts\init_db.py`. |
| Port 8000 already in use | Use `--port 8100` and point the client at the new URL. |
| Inspector cannot connect | Make sure the transport is Streamable HTTP and the URL ends with `/mcp`. |

## Known limitations

- Only one tool (`search_properties`) exists.
- No authentication; the server is for local use only.
- All data is synthetic and covers Ernakulam/Kochi only.
- `commute_convenience` is accepted but has no data behind it.
- No dedicated web frontend; the MCP Inspector is the local UI.

## Roadmap

- Phase 5: `get_property`, `get_reviews`, `compare_properties` tools
- Authentication and rate limiting for the MCP endpoint
- FastAPI REST layer and a web frontend that reuse the same backend
- Real, independently verified listings

## Team

| Member | Role | Owns in this repo |
| --- | --- | --- |
| **Malavika** | Project lead, AI and search | Architecture, MCP server and tool design (`app/mcp_server/server.py`), search ranking rules (`app/backend/search_service.py`), AI client integration |
| **Adwaitha** | Frontend and design | MCP Inspector setup and demo flow, tool descriptions and response wording shown to AI clients, alignment with the web app UI |
| **Sagnika** | Backend and data | PostgreSQL schema (`app/db/schema.sql`), Ernakulam seed data (`app/db/seed_data.py`), database scripts (`scripts/init_db.py`), input and output models (`app/backend/models.py`) |
| **June** | Quality, security and docs | Test suites (`tests/`), security review (input limits, SQL safety, timeouts, dependency audit), this README and `PROGRESS.md` |

Everyone reviews changes outside their own area before they are merged.
