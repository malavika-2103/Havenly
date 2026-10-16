# Havenly ✦

A cozy, women-focused accommodation discovery UI — find PGs, hostels and shared rentals through
conversational search, verified resident reviews, and side-by-side comparison.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173

## What’s inside

| Page | Path | What it does |
| --- | --- | --- |
| Home | `/` | Conversational search bar (“Women’s PG near Infopark under 9000 with food”), explore-by-type cards, top-rated stays, experiences teaser |
| Results | `/results` | Search results with a full filter panel — type, budget, curfew, WiFi, mess/food, garbage disposal, cleaning, room type, ratings, verified-only, AC — plus sort, removable filter chips, and an empty state |
| Unit page | `/property/:id` | The page that sells the place: photo gallery, at-a-glance tiles, facilities, cost breakdown, house rules, category rating bars, **reported differences** (listing vs resident reports), verified reviews, location, and a sticky **booking card** with live estimate + request modal |
| Saved | `/saved` | Personal shortlist (persists in localStorage) |
| Compare | `/compare` | Up to 3 places side by side, with “Best” markers per row |
| Experiences | `/experiences` | Feed of verified-resident reviews across properties |
| About | `/about` | Verification, AI-assisted moderation, and FAQ |

## Design

Warm “cozy” theme using the Havenly palette:

- `#923B5D` plum (primary) · `#B6728B` mauve · `#AABAAF` sage · `#E2D6BE` cream · `#A0977A` olive
- Fraunces (display serif) + Nunito (rounded body)
- Rounded cards, soft shadows, blob backgrounds, hand-drawn SVG illustrations for property photos

## Notes

- **Conversational search** — `src/lib/search.ts` parses budget (“under 15k”), locality, type, food,
  AC, curfew and room type from free text, shows them as “I heard:” chips, and passes them to the
  results page as filters.
- **Information provenance** — listings separate owner claims, platform verification, and resident
  reports. “Reported differences” are framed as reports, never verdicts.
- Mock data lives in `src/data/properties.ts` (temporary; replaced by the API) — swap for an API
  when the backend lands.
- Property “photos” are palette-matched SVG illustrations so the demo works fully offline.

## Stack

Vite · React 18 · TypeScript · React Router 6 · plain CSS design system (`src/styles/global.css`)
