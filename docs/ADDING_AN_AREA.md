# Adding an area

Adding an area is a data task. No application code changes. The UI reads the area name, example searches and filter options (localities, landmarks) from the API, and the API reads them from the database using `ACTIVE_AREA`.

## Steps

1. **Area row.** Add the area to `server/seed/data/areas.ts` (or insert it with `data_source = 'manual_verified'` in production) with `status: 'coming_soon'`. From then on, searches that mention it return the “coming soon” state and collect waitlist emails (`area_waitlist`).

2. **Sub-areas.** Add the localities with approximate centroids to `subAreas.ts` (`area_id` = the new area). Only sub-areas that have at least one listing appear as filter options.

3. **Landmarks.** Add IT parks, campuses, government offices and transit points to `landmarks.ts` with `kind` and `aliases` (other names people type, e.g. `["smart city", "smartcity"]`). The interpreter matches names and aliases from the database, and builds its clarifying questions (“Which college?”) from the landmarks of each `kind`. Commute rows are computed from coordinates by the seed (`server/src/lib/geo.ts`).

4. **Properties.** For each verified listing add one record per entity file: `properties.ts`, `rooms.ts`, `wifi.ts`, `food.ts`, `cleaning.ts`, `rules.ts`, `safety.ts`, `propertyAmenities.ts`, `owners.ts`. In production these are entered through the admin API (`POST /api/admin/properties`, `/rooms`, `/provenance`). Every rule and safety field needs a provenance row: `owner_listed` by default, `platform_verified` only with `evidence_type`, `verified_by` and a date from a real check.

5. **Validate.** Point the server at the new area and run the checks:

   ```bash
   ACTIVE_AREA=<slug> npm run seed
   ACTIVE_AREA=<slug> npm run validate
   ```

   `validate` checks that every property belongs to the active area, sits within 4 km of its centre, has provenance for every rule and safety field, has commute times that match its coordinates, never mentions another area, and that no public response exposes owner contacts. Some checks are pitch-specific quotas for the Kakkanad demo (16 properties, curfew mix, and so on). Move those into a per-area expectations file, or drop them, when real data arrives.

6. **Flip to active.** Set the area’s `status` to `active` and set `ACTIVE_AREA=<slug>` in `.env`. To serve several areas at once, the next step is to replace the single `ACTIVE_AREA` filter with an `area` query parameter. Every query already joins through `areas.slug`, so that is a small, contained change.

## Where the launch area is named

The launch area (“Kakkanad”) appears only in:

- `.env` / `.env.example` (`ACTIVE_AREA=kakkanad`) and the `config.ts` default
- `server/seed/data/*` (the demo data itself)

The UI and server code read it from `/api/meta` and the database. To check:

```bash
grep -rni kakkanad src server/src | grep -v config.ts   # expect no output
```
