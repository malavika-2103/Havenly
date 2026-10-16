# Havenly API

Base URL in development: `http://localhost:8787/api` (the web app reaches it at `/api` through the Vite proxy).

All responses are JSON. Errors look like this:

```json
{ "error": { "code": "ROOM_FULL", "message": "Human-readable explanation", "details": { } } }
```

**Auth.** `POST /auth/demo-login` returns a token. Send it as `Authorization: Bearer <token>`. Admin endpoints take `X-Admin-Token: <ADMIN_TOKEN>`.

**Area scope.** Every public read is limited to the area named by `ACTIVE_AREA`.

## Public

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/meta` | — | `active_area`, `coming_soon[]`, `demo`, `demo_notice`, `example_searches[]`, `payments_enabled: false` |
| GET | `/filters` | — | `groups[]`, `filters[]` (`key, label, group, kind, options, range, commute, supported, source_note, help`), `sorts[]` |
| GET | `/properties` | any filter key from `/filters`, plus `q, sort, page, limit` | `total, page, limit, results[], facets, applied, ignored[]` |
| GET | `/properties/:slug` | — | Summary plus `description, costs, amenities, facts{wifi,food,cleaning,rules,safety}` (each fact has `source`), `source_counts, rooms[], commute[], reported_differences[], review_summary` |
| GET | `/properties/:slug/reviews` | `sort=helpful\|recent\|rating_low`, `type` | `total, results[]` (approved only; `is_sample`, `verified_resident`) |
| GET | `/reviews` | `sort, limit, type` | Approved reviews across the area |
| GET | `/compare` | `ids=slug1,slug2,slug3` (max 3) | `properties[], rows[{key,label,group,values,sources,differs,best_index}], note` |
| POST | `/search/interpret` | `{ "query": "..." }` | `filters, chips[], unsupported[], clarification, out_of_coverage` |
| POST | `/properties/:slug/estimate` | `{ room_type, move_in_date, duration_months, include_mess }` | Itemised `lines[]`, `estimated_total, refundable_total, due_at_move_in, notes[], resident_reported_costs[]` |
| POST | `/waitlist` | `{ email, area_slug }` | Joins a coming-soon area’s waitlist |
| POST | `/auth/demo-login` | `{ display_name? }` | `{ token, user }` |

### Filter keys for `GET /properties`

`type, gender_policy, occupant_focus, sub_area, room_type` (comma-separated multi) · `occupancy` · `ac, attached_bathroom, available_now` · `rent_min, rent_max` · `wifi_free, wifi_min_mbps, laundry, power_backup, hot_water_24h` · `food_included, veg_options, cuisine` · `cleaning_min_per_week, garbage` · `curfew_type, late_entry, gate_close_after, visitors` · `cctv_min, guard_24x7, female_warden, biometric_entry, main_road_within_m` · `near_landmark` + `max_minutes` + `commute_mode (walk|auto|bus)` · `verified_only, min_rating, has_reviews` · `q` (name/locality text) · `sort = relevance | rent_asc | rent_desc | rating | nearest | recently_verified`.

Unknown keys aren’t applied. They come back in `ignored`.

## Signed-in user

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/auth/me` | — | Current user |
| POST | `/bookings` | `{ property_slug, room_type, move_in_date, duration_months, include_mess, note? }` + header `Idempotency-Key` | 201 with `booking`. The same key returns the same booking (200, `replayed: true`). 409 `ROOM_FULL` (details include `waitlist_open`), 409 `DUPLICATE_REQUEST`, 400 on invalid input |
| GET | `/bookings` | — | Your requests (expired ones are marked lazily) |
| GET | `/bookings/:reference` | — | One of your requests |
| POST | `/bookings/:reference/cancel` | — | Allowed from submitted, owner_notified or accepted (frees the bed) |
| POST | `/properties/:slug/waitlist` | `{ room_type }` | Only when that room type is full and its waitlist is open |
| GET | `/saved` | — | Saved places as summaries |
| PUT | `/saved` | `{ slug, saved: true\|false }` or `{ slugs: [...] }` | Returns `{ slugs }` |
| POST | `/reviews` | `{ property_slug, overall_rating, ratings?, title, body, review_type, stay_start?, stay_end?, currently_staying? }` | Always `pending`. `verified_resident` is true only if residency is approved |
| POST | `/reviews/:id/helpful` | — | One per user |
| POST | `/reviews/:id/report` | `{ reason }` | One per user; 3 reports auto-flag |
| POST | `/residency` | `{ property_slug, evidence_type }` | Creates a pending residency check. No file is uploaded or stored |

## Admin (`X-Admin-Token`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/overview` | Queue counts |
| GET / POST | `/admin/properties` | List (with owner contacts) / create |
| GET / PATCH / DELETE | `/admin/properties/:id` | Read with rooms and provenance / update / delete |
| POST | `/admin/properties/:id/verification` | `{ status }`. Refuses `verified` or `partially_verified` without platform_verified provenance |
| POST | `/admin/properties/:id/rooms` · PATCH/DELETE `/admin/rooms/:roomId` | Inventory CRUD (updates `availability_updated_at` and the rent range) |
| POST | `/admin/properties/:id/provenance` · PATCH/DELETE `/admin/provenance/:id` | Provenance editing. platform_verified needs `evidence_type` and `verified_by` |
| GET | `/admin/verification-queue` | Properties not fully verified and pending residency checks |
| POST | `/admin/residency/:id` | `{ status: approved\|rejected }`. Updates that user’s reviews of that place |
| GET | `/admin/reviews?status=pending,flagged` | Moderation queue |
| POST | `/admin/reviews/:id/moderate` | `{ status, note? }` |
| GET | `/admin/bookings?status=` | Booking queue |
| POST | `/admin/bookings/:reference/status` | `{ status: owner_notified\|accepted\|declined }`. Accept decrements a bed |
| GET | `/admin/waitlists` | Room and area waitlist counts |
| POST | `/admin/purge-demo` | `{ "confirm": "PURGE" }` |

## curl examples

These run against a freshly seeded database (`npm run seed && npm run dev`). Pick a move-in date within the next 90 days.

```bash
A=http://localhost:8787/api
J='Content-Type: application/json'

# Each filter narrows the results (16 → fewer)
curl -s "$A/properties" | jq .total
curl -s "$A/properties?curfew_type=none" | jq .total                       # 9
curl -s "$A/properties?rent_min=18000" | jq '.results[].name'
curl -s "$A/properties?near_landmark=infopark-phase-1&max_minutes=10" | jq .total

# Out-of-coverage searches return no filters and no results
curl -s -X POST $A/search/interpret -H "$J" -d '{"query":"PG in Bangalore under 10k"}' | jq '.out_of_coverage, .filters'
curl -s -X POST $A/search/interpret -H "$J" -d '{"query":"hostel in Vyttila"}' | jq .out_of_coverage

# Compare caps at 3
curl -s "$A/compare?ids=tulsi-nest-womens-pg,kayal-house-ladies-hostel,coconut-grove-coliving,nila-womens-hostel" | jq .error.code   # COMPARE_LIMIT

# Estimates come from the database
curl -s -X POST $A/properties/kayal-house-ladies-hostel/estimate -H "$J" \
  -d '{"room_type":"double","move_in_date":"2026-11-20","duration_months":6}' | jq '.lines[] | {label, amount}, .estimated_total'

# Bookings: sign in, request, replay, duplicate, full room, invalid date
TOKEN=$(curl -s -X POST $A/auth/demo-login -H "$J" -d '{}' | jq -r .token); H="Authorization: Bearer $TOKEN"
curl -s -X POST $A/bookings -H "$J" -H "$H" -H 'Idempotency-Key: demo-1' \
  -d '{"property_slug":"ixora-ladies-pg","room_type":"double","move_in_date":"2026-11-20","duration_months":6}' | jq .booking.reference
curl -s -X POST $A/bookings -H "$J" -H "$H" -H 'Idempotency-Key: demo-1' \
  -d '{"property_slug":"ixora-ladies-pg","room_type":"double","move_in_date":"2026-11-20","duration_months":6}' | jq .replayed        # true
curl -s -X POST $A/bookings -H "$J" -H "$H" -H 'Idempotency-Key: demo-2' \
  -d '{"property_slug":"ixora-ladies-pg","room_type":"double","move_in_date":"2026-11-21","duration_months":6}' | jq .error.code     # DUPLICATE_REQUEST
curl -s -X POST $A/bookings -H "$J" -H "$H" \
  -d '{"property_slug":"tulsi-nest-womens-pg","room_type":"single","move_in_date":"2026-11-20","duration_months":6}' | jq .error.code # ROOM_FULL
curl -s -X POST $A/bookings -H "$J" -H "$H" \
  -d '{"property_slug":"ixora-ladies-pg","room_type":"triple","move_in_date":"2027-06-01","duration_months":6}' | jq .error.code    # INVALID_MOVE_IN

# Owner contact fields never appear publicly (prints 0)
curl -s "$A/properties/tulsi-nest-womens-pg" | grep -c 'owner\|555 010'

# Admin moves a request through its lifecycle
REF=HV-3F7Q-9A2K   # sample request from the seed
curl -s -X POST $A/admin/bookings/$REF/status -H "$J" -H 'X-Admin-Token: havenly-admin-demo' -d '{"status":"owner_notified"}' | jq .status
curl -s -X POST $A/admin/bookings/$REF/status -H "$J" -H 'X-Admin-Token: havenly-admin-demo' -d '{"status":"accepted"}' | jq .status_label
```

`npm test` runs these checks and more automatically against a throwaway database.
