# Assumptions

Decisions made where the brief left room. Each one is easy to change.

## Product and honesty

- **Payment happens off-platform.** Havenly takes no payment. If an owner accepts a request, the person visits and pays the property directly. The estimate shows a “due at move-in (to the property)” line for planning only.
- **Requests never hold a bed.** `available_beds` drops by one only when the owner accepts, which in the demo an admin simulates. Cancelling an accepted request gives the bed back.
- **Requests expire after 72 hours** (`BOOKING_EXPIRY_HOURS`) if there’s no owner response. Expiry is applied lazily whenever requests are read, so no background job is needed. The three seeded sample requests expire on 31 Dec 2026, so they stay visible through the pitch.
- **Idempotency.** A repeated submit with the same `Idempotency-Key` returns the original request (HTTP 200, `replayed: true`). The UI keeps one key per form state, so double-clicks and retries are safe. After a successful request it starts a new key, so a deliberate second request is blocked by the duplicate check.
- **Duplicates** means an open request (`submitted` or `owner_notified`) from the same user for the same property and room type.
- **Move-in date** must be from tomorrow to 90 days ahead, by the calendar date in India (Asia/Kolkata).
- **“Verified” badge** requires `verification_status = 'verified'` **and** at least one `platform_verified` provenance row. Partly verified places show “Partly verified”. All verification records are demo records, and the UI says so.
- **Owner food descriptions are never “verified”.** Havenly can check that a mess exists and its timings, not how good the food is.
- **Ratings appear only from 3 approved reviews.** Below that, the API returns `rating: null` and “Not enough reviews yet”. The `min_rating` filter also needs 3 reviews.
- **New reviews always go to moderation** (`pending`), whether or not the stay is verified. Verified residency only decides the “stay verified” label.
- **Safety reports** are labelled in the UI as one resident’s personal experience. The validator checks that each one is written in the first person.
- **Reported differences** need at least two approved reviews and are phrased as reports (“Residents report…”), never as findings.

## Data

- **`data_source` values.** `demo_seed` for pitch data, `manual_verified` for data entered by the team, and `user_submitted` for rows created by people using the app (demo logins, their bookings, reviews and saved places). `purge:demo` removes only `demo_seed`. Runtime rows that point at demo properties go with them through `ON DELETE CASCADE`.
- **Amenity catalogue** (Wi-Fi, AC, …) is reference data marked `manual_verified`, so it survives a purge.
- **Geography rows** (areas, sub-areas, landmarks) are seeded as `demo_seed` because their coordinates are approximate.
- **Deterministic seed.** Fixed RNG seed (`20261017`) and fixed timestamps (seed time `2026-10-15T09:00Z`). Availability and verification dates are set around mid-October 2026 for a pitch on 17 October 2026. For a later pitch, shift the dates in `rooms.ts` and `properties.ts`.
- **Commute times** are computed from coordinates: straight-line distance × 1.35 road factor, walking at 4.8 km/h, auto at 18 km/h plus 3 minutes, bus at 14 km/h plus 10 minutes. These are estimates and are labelled that way.
- **Owners** are “Demo Owner A–P” with `+91 555 010 xxxx` numbers and `example.com` emails.
- **Landmark names are real** (Infopark, SmartCity Kochi, Rajagiri Valley, Model Engineering College, Bharata Mata College, Civil Station, Cochin SEZ). Property names, people and addresses are invented. No house numbers.

### Localities I’m less sure about

All sub-area coordinates are approximate centroids. These three could be outside “Kakkanad” as residents use the word:

- **Palachuvadu** is closer to the Vennala side. It holds one demo listing.
- **Vazhakkala** sits on the Thrikkakara municipality edge, towards Palarivattom. It holds one demo listing.
- **NGO Quarters** is included as a locality. Some people treat it as part of Kakkanad town.

I left out **Kangarappady**, which is further north towards Kalamassery.

## Search interpretation

- **Rule-based now**, behind `Interpreter` in `server/src/services/interpret.ts`. An LLM can replace `ruleBasedInterpreter`. Its output still passes through `sanitize()`, which drops any key or value that isn’t in the filter registry and reports it as unsupported.
- **“Near X” means within 15 minutes by auto**, or 15 minutes on foot when the query says “walk”. Both are shown in an editable chip.
- **“With Wi-Fi” means free Wi-Fi.** Every listing has Wi-Fi, so the useful reading is that it’s included. “Fast Wi-Fi” and “work from home” mean 100+ Mbps listed.
- **“With food” means included or optional mess.** “Clean” means room cleaning 3+ times a week. “Guard” or “security guard” means a 24x7 guard. Each of these is an editable chip, so a wrong guess is easy to fix.
- **“Safe” is never a filter.** It comes back as unsupported, with a pointer to the specific safety features.
- **Out of coverage**: coming-soon areas come from the database. Other cities and Kochi localities are listed in `server/src/config/coverage.ts`, used only to say “not here yet”.
- **Compare** stays in the browser (max 3, also enforced by the API). Saved places are on the server, per user.

## Auth

- **Demo auth.** The first visit creates a “Demo guest” user and stores an HMAC-signed token in `localStorage`. “Start a fresh demo session” in the avatar menu creates a new user. This is not production auth.
- **Admin** uses one shared token from `.env`, sent as `X-Admin-Token`. The admin screen keeps it in `localStorage` on that browser.

## Tech

- **Express 5 + better-sqlite3.** Synchronous SQLite keeps transactions simple for booking acceptance. The schema avoids SQLite-only types, and filters run against a `property_search` view that maps directly to a Postgres view.
- **Client stays at the repo root**, the server lives in `/server` and shared types in `/shared`. One `npm install` covers both, and `npm run dev` starts both with `concurrently`.
- **Photos** are still the palette illustrations from the original UI, labelled “photos coming soon”.
