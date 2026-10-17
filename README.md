# Havenly ✦

Discovery, verification and booking requests for PGs, hostels and shared rentals, for people moving to a new city. Launching in one area: **Kakkanad, Ernakulam, Kerala**.

Havenly always separates three kinds of information: **listed by owner**, **verified by Havenly**, and **reported by residents**.

> **Demo data.** Every listing, review, owner record and booking in this repo is a fictional sample. Each row has `data_source = 'demo_seed'`, and the UI shows a demo notice on every page footer and on every property page. No payment is taken anywhere. Owner responses to booking requests are simulated.

## Run it

Requires Node 20+ (tested on Node 24).

```bash
npm install      # also creates .env from .env.example
npm run seed     # creates server/data/havenly.db with the Kakkanad demo data
npm run dev      # API on :8787 and the web app on http://localhost:5173 (Vite proxies /api)
```

| Command | What it does |
| --- | --- |
| `npm run seed` | Deterministic, idempotent seed. Re-running replaces all demo rows with identical data. **Use it to reset before a pitch.** |
| `npm run validate` | 93 data checks (quotas, consistency between reviews and listings, area scope, provenance, owner privacy over the live API). Prints PASS/FAIL, exits 1 on failure. |
| `npm test` | 37 API tests on a throwaway database (filters, coverage, compare cap, estimates, booking rules, privacy, body errors, live web results with Tavily mocked). |
| `npm run purge:demo` | Removes every `demo_seed` row in one transaction. Data from real users and manually verified data stays. |
| `npm run typecheck` | Type-checks client and server. |

`.env` keys: `PORT`, `HOST` (default `127.0.0.1`, only this computer; use `0.0.0.0` when deploying), `ACTIVE_AREA` (default `kakkanad`), `ADMIN_TOKEN` (default `havenly-admin-demo`), `TOKEN_SECRET`, `DB_PATH`, `DEMO_MODE`, `BOOKING_EXPIRY_HOURS`, `TAVILY_API_KEY` (optional, turns on live web results; see below).

## Pitch walkthrough (about 3 minutes)

Run `npm run seed` first so the demo starts clean.

1. **Search** (Home). Click the example “Women's PG near Infopark under 9000 with food”, or type it. While you type, the “I heard” chips show what Havenly understood. Remove a chip with ×, or click one to edit it. Then add “and a gym”. It appears as a dashed “Can’t filter by” chip, because Havenly never pretends to match what it doesn’t track. Type “hostel in Vyttila” to show the friendly *coming soon* state with an email waitlist.
2. **Filter** (Results). Open the filter panel. Every group and option comes from `/api/filters`, with live counts. Turn on *Safety features → 24x7 security guard* and point out that each safety item states its source and there’s no safety score.
3. **Property** (Kayal House Ladies Hostel). Show the *Verified by Havenly · demo* labels next to *Listed by owner*, and the banner *Residents report the curfew is stricter than the listing implies*, which links to the reviews behind it. Scroll to *Rooms and availability* (“as last updated by the listing”) and the reviews marked *Sample review*.
4. **Compare**. Add Tulsi Nest, Kayal House and Coconut Grove, then open Compare. Differences are highlighted, with no combined score. A fourth place is refused.
5. **Booking request**. On Kayal House, pick *Double sharing*, 6 months. The estimate is itemised by the server. Click **Request booking**. The modal says the request is *recorded*, that the owner response is *simulated*, and that no payment is taken. Click again to show the duplicate request being blocked.
6. **Admin accepts it**. Avatar menu → *Admin (demo)*, token `havenly-admin-demo`. In *Bookings*, click **Notify owner**, then **Accept**. Back in *My booking requests*, the status reads *Accepted by owner (simulated)* and the free-bed count dropped by one.

Optional: show Tulsi Nest’s *Single room*, which is full with an open waitlist, and Lotus Residency, which is fully booked.

## What’s inside

```
server/
  src/
    schema.sql          SQLite schema, portable to Postgres/PostGIS (+ property_search read view)
    config.ts           .env config; ACTIVE_AREA decides which area is served
    app.ts, index.ts    Express app (exported for tests) and entry point
    auth.ts             demo auth (HMAC-signed token), admin token check
    routes/public.ts    public + booking endpoints
    routes/admin.ts     admin CRUD and queues (the only code that reads owner contacts)
    services/
      filters.ts        filter registry: /api/filters, SQL, facets and interpreter keys
      interpret.ts      rule-based natural language → filters, behind an Interpreter interface
      properties.ts     list, detail grouped by source, compare
      facts.ts          per-fact labels and provenance
      estimate.ts       itemised estimate from the database
      bookings.ts       request lifecycle, idempotency, duplicate check, expiry, waitlist
      reviews.ts        review summary, submission, helpful/report
    config/coverage.ts  place names that are not covered yet (used only for “not here yet”)
  seed/
    data/*.ts           one file per entity (areas, sub-areas, landmarks, properties, rooms, …)
    seed.ts             deterministic seed (fixed RNG seed and timestamps)
    validate.ts         data validation report
    purge.ts            remove all demo_seed rows
  test/api.test.ts      API tests
shared/types.ts         API contract used by server and client
src/                    React UI (Vite + React 18 + React Router)
  lib/api.ts            typed API client
docs/                   API reference, adding an area, assumptions
```

## API

See [docs/API.md](docs/API.md) for every endpoint with curl examples. Summary:

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/meta` | Active area, coming-soon areas, demo flag and notice, example searches |
| GET | `/api/filters` | Single source of truth for filters, groups and sorts |
| GET | `/api/properties` | Filtered list with `total`, `facets`, `applied`, `ignored` |
| GET | `/api/properties/:slug` | Full profile: facts grouped by source, rooms, commute, reported differences, review summary |
| GET | `/api/properties/:slug/reviews` | Approved reviews, `sort=helpful|recent|rating_low` |
| GET | `/api/reviews` | Approved reviews across the area |
| POST | `/api/reviews` | Auth. Saved as pending; verified only if residency is approved |
| POST | `/api/reviews/:id/helpful` · `/report` | Auth. One vote per user; 3 reports auto-flag |
| POST | `/api/residency` | Auth. Request residency verification (no file stored) |
| GET | `/api/compare?ids=a,b,c` | Max 3; aligned rows with `differs`, `best_index`, `sources` |
| POST | `/api/search/interpret` | `{query}` → `{filters, chips, unsupported, clarification, out_of_coverage}` |
| GET | `/api/search/web?q=` | Live, unverified web links from Tavily for the same search. `503 WEB_SEARCH_DISABLED` when no key is set. |
| POST | `/api/properties/:slug/estimate` | `{room_type, move_in_date, duration_months, include_mess}` |
| POST | `/api/bookings` | Auth. `Idempotency-Key` header. 409 `ROOM_FULL` / `DUPLICATE_REQUEST` |
| GET | `/api/bookings` · `/api/bookings/:reference` | Auth. Your requests |
| POST | `/api/bookings/:reference/cancel` | Auth |
| POST | `/api/properties/:slug/waitlist` | Auth. Only for full room types with an open waitlist |
| POST | `/api/waitlist` | Area waitlist `{email, area_slug}` |
| GET / PUT | `/api/saved` | Auth. Server-side saved places |
| POST | `/api/auth/demo-login` · GET `/api/auth/me` | Demo auth |
| * | `/api/admin/*` | `X-Admin-Token` required. Properties and rooms CRUD, provenance, verification and residency queue, review moderation, booking queue, waitlists, purge |

## Live web results (Tavily)

When someone searches with the search bar, the results page also shows a **From the web** section below Havenly's own listings. It holds live links from a [Tavily](https://tavily.com) web search, scoped to accommodation in the active area.

Turn it on by adding your key to `.env`, then restart `npm run dev` (the server reads `.env` only at startup):

```
TAVILY_API_KEY=tvly-...
```

Without a key the endpoint answers `503 WEB_SEARCH_DISABLED` and the section says live web results are off. Nothing else changes.

How it stays honest and safe:

- Web results are **never** mixed into, ranked with, or styled like Havenly listings. They sit in a separate dashed panel labelled **Unverified**, with a warning not to pay a deposit before visiting.
- The key stays on the server (sent to Tavily in an `Authorization` header) and never reaches the browser or an error message.
- Only `http`/`https` links are shown; titles and snippets are clipped to 300 characters; links open in a new tab with `rel="noopener noreferrer nofollow ugc"`.
- Queries are 2-200 characters. Identical searches are cached for 10 minutes and each client is limited to 20 web searches a minute, to save Tavily credits.
- Tavily failures return `502 WEB_SEARCH_FAILED` (or `WEB_SEARCH_KEY_INVALID` for a rejected key) after an 8-second timeout, without exposing the provider's response.

Code: `server/src/services/webSearch.ts`, route in `server/src/routes/public.ts`, UI in `src/components/WebResults.tsx`.

## Team

| Member | Role | Owns |
| --- | --- | --- |
| **Malavika** | Project lead, AI and search | Product scope and architecture, natural-language search (`server/src/services/interpret.ts`), live web results with Tavily (`server/src/services/webSearch.ts`, `src/components/WebResults.tsx`), the companion MCP server repo |
| **Adwaitha** | Frontend and design | Design system and brand (`src/styles/`, favicon), all pages in `src/pages/`, components in `src/components/` (navbar, search bar, filters, property cards, compare view), typed API client (`src/lib/api.ts`) |
| **Sagnika** | Backend and data | Express API (`server/src/app.ts`, `server/src/routes/`), SQLite schema (`server/src/schema.sql`), Kakkanad seed data (`server/seed/`), booking requests, estimates and waitlists (`server/src/services/bookings.ts`, `estimate.ts`), admin queues |
| **June** | Quality, security and docs | API test suite (`server/test/api.test.ts`), data validator (`server/seed/validate.ts`), security review (input limits, request-body errors, local-only dev servers, dependency audit), README and `docs/`, pitch walkthrough |

Shared: everyone reviews pull requests outside their own area, and the trust rules below are owned by the whole team.

## Rules the code enforces

- Booking is a request flow only. No payments, no call or message buttons, and owner contacts never appear in a public response (checked by `validate` and `npm test`).
- “Verified” only appears where `platform_verified` provenance exists. An admin can’t mark a place verified without it. In the demo every verified label says *demo*.
- No combined safety score anywhere. Safety is a list of facts, each with its source.
- Every price is computed by the server. The UI renders amounts from `/estimate` and the property detail only.
- No area is hardcoded outside config and seed data. See [docs/ADDING_AN_AREA.md](docs/ADDING_AN_AREA.md).

Assumptions are listed in [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md).
