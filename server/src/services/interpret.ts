// Natural language -> filters. Rule-based for now, behind a small interface so an LLM-backed
// interpreter can replace it. Whatever produces the draft, sanitize() guarantees that only keys and
// values that exist in the filter registry reach the client, and never claims an unsupported match.
import type { DB } from '../db'
import { parseJson } from '../db'
import { config } from '../config'
import { OUT_OF_COVERAGE_PLACES } from '../config/coverage'
import { registry } from './filters'
import type { InterpretChip, InterpretResult, FilterValues } from '../../../shared/types'

export interface InterpretContext {
  activeArea: { slug: string; name: string; district: string }
  comingSoon: { slug: string; name: string }[]
  subAreas: { slug: string; name: string; hasListings: boolean }[]
  landmarks: { slug: string; name: string; kind: string; aliases: string[] }[]
}

export interface Interpreter {
  interpret(query: string, ctx: InterpretContext): Omit<InterpretResult, 'chips'>
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()
const has = (text: string, re: RegExp) => re.test(text)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Find the landmark a query mentions, using names and aliases from the database.
 * Longer names win, so "infopark phase 2" beats "infopark".
 */
function findLandmark(text: string, landmarks: InterpretContext['landmarks']) {
  const candidates = landmarks
    .flatMap((l) => [l.name, ...l.aliases].map((n) => ({ slug: l.slug, term: norm(n).replace(/\s*\(.*\)$/, '') })))
    .sort((a, b) => b.term.length - a.term.length)
  return candidates.find((c) => new RegExp(`\\b${escapeRe(c.term).replace(/\\? /g, '\\s*')}\\b`).test(text))?.slug ?? null
}

const UNSUPPORTED: [RegExp, string, string][] = [
  [/\bgym\b|fitness/, 'gym', 'We don’t track gyms yet.'],
  [/swimming|\bpool\b/, 'swimming pool', 'We don’t track pools yet.'],
  [/\bbeach\b|sea ?view|lake ?view|backwater/, 'views or beach', 'Listings don’t record views or distance to the beach.'],
  [/\bquiet\b|peaceful|calm area|no noise/, 'quiet', 'Noise is subjective, so it isn’t a filter. Resident reviews often mention it.'],
  [/\bpets?\b|\bdogs?\b|\bcats?\b/, 'pets', 'Pet policies aren’t tracked yet.'],
  [/balcony/, 'balcony', 'Balconies aren’t tracked yet.'],
  [/\bmetro\b/, 'metro', 'Metro access isn’t tracked. Commute times to landmarks are available.'],
  [/couples?|married/, 'couples', 'Rooms for couples aren’t listed yet.'],
  [/parking|\blift\b|elevator|fridge|\btv\b|study table/, 'specific facility', 'This shows on each place’s facilities list, but isn’t a search filter yet.'],
  [/overnight guests?/, 'overnight guests', 'Check the house rules on each place. It isn’t a filter yet.'],
  [/\b(safe|safety|secure)\b/, 'safe', 'Havenly doesn’t give places a single safety score. Try specific features: CCTV, 24x7 guard, female warden, distance to main road.'],
  [/\bcheap(est)?\b|affordable|low budget/, 'cheap', 'Give a monthly amount, for example “under 8000”.'],
]

const NUMBER = String.raw`(?:₹|rs\.?\s*|inr\s*)?(\d+(?:[.,]\d+)?)\s*(k|thousand|000)?`

function parseAmount(num: string, unit?: string) {
  let v = parseFloat(num.replace(/,/g, ''))
  if (unit === 'k' || unit === 'thousand') v *= 1000
  if (unit === '000') v = v * 1000
  if (v > 0 && v < 100) v *= 1000 // "under 9" in a rent context means 9k
  return Math.round(v)
}

const roundTo = (v: number, step = 500) => Math.round(v / step) * step

export const ruleBasedInterpreter: Interpreter = {
  interpret(query, ctx) {
    const text = norm(query)
    const f: FilterValues = {}
    const unsupported: { text: string; reason: string }[] = []
    let clarification: string | null = null
    const ask = (q: string) => {
      if (!clarification) clarification = q
    }

    // ---------- coverage first ----------
    const inArea =
      text.includes(ctx.activeArea.slug) ||
      ctx.subAreas.some((s) => text.includes(s.name.toLowerCase())) ||
      findLandmark(text, ctx.landmarks) !== null
    if (!inArea) {
      const soon = ctx.comingSoon.find((a) => text.includes(a.name.toLowerCase()))
      if (soon) {
        return {
          query,
          filters: {},
          unsupported: [],
          clarification: null,
          out_of_coverage: {
            place: soon.name,
            coming_soon: true,
            area_slug: soon.slug,
            message: `${soon.name} is coming soon. Havenly currently covers ${ctx.activeArea.name}, ${ctx.activeArea.district} only. Leave your email and we’ll tell you when ${soon.name} opens.`,
          },
        }
      }
      const other = OUT_OF_COVERAGE_PLACES.find((p) => new RegExp(`\\b${p.toLowerCase()}\\b`).test(text))
      if (other) {
        return {
          query,
          filters: {},
          unsupported: [],
          clarification: null,
          out_of_coverage: {
            place: other,
            coming_soon: false,
            area_slug: null,
            message: `We don’t cover ${other} yet. Havenly currently lists places in ${ctx.activeArea.name}, ${ctx.activeArea.district} only.`,
          },
        }
      }
    }

    // ---------- who ----------
    if (has(text, /\b(women'?s?|woman|ladies|lady|girls?'?|female|working women)\b/)) f.gender_policy = 'women_only'
    else if (has(text, /\b(men'?s?|gents|boys?'?|male)\b/)) f.gender_policy = 'men_only'
    else if (has(text, /\bco-?ed\b|\bmixed\b|unisex/)) f.gender_policy = 'mixed'

    if (has(text, /\bstudents?\b|college|campus|\bcourse\b/)) f.occupant_focus = 'students'
    else if (has(text, /working|professional|techie|\bit\b|office|\bjob\b|employee|\bshift/)) f.occupant_focus = 'working_professionals'

    // ---------- type ----------
    const types: string[] = []
    if (has(text, /\bpg\b|paying guest/)) types.push('PG')
    if (has(text, /hostel/)) types.push('Hostel')
    if (has(text, /shared (rental|flat|house|apartment)|flat ?mates?|co-?living|\bflat\b|apartment/)) types.push('Shared Rental')
    if (types.length) f.type = types.join(',')

    // ---------- budget ----------
    const between = text.match(new RegExp(`between\\s*${NUMBER}\\s*(?:and|to|-)\\s*${NUMBER}`))
    const range = text.match(new RegExp(`${NUMBER}\\s*(?:-|to)\\s*${NUMBER}\\b`))
    const max = text.match(new RegExp(`(?:under|below|less than|upto|up to|within|max(?:imum)?|budget(?: of| is)?|not more than|<=?|till)\\s*${NUMBER}`))
    const around = text.match(new RegExp(`(?:around|about|approx(?:imately)?|roughly)\\s*${NUMBER}`))
    const above = text.match(new RegExp(`(?:above|over|more than|at least|min(?:imum)?)\\s*${NUMBER}`))
    if (between || (range && /k|000|₹|rs/.test(range[0]))) {
      const m = (between ?? range)!
      const lo = parseAmount(m[1], m[2] ?? m[4])
      const hi = parseAmount(m[3], m[4])
      f.rent_min = String(Math.min(lo, hi))
      f.rent_max = String(Math.max(lo, hi))
    } else if (max) {
      f.rent_max = String(parseAmount(max[1], max[2]))
    } else if (around) {
      const v = parseAmount(around[1], around[2])
      f.rent_min = String(roundTo(v * 0.85))
      f.rent_max = String(roundTo(v * 1.15))
    }
    if (above) f.rent_min = String(parseAmount(above[1], above[2]))
    for (const k of ['rent_min', 'rent_max']) {
      const v = Number(f[k])
      if (f[k] && (v < 1000 || v > 100000)) delete f[k]
    }

    // ---------- room ----------
    const rooms: string[] = []
    if (has(text, /\bsingle\b|private room|own room|1 sharing|single occupancy/)) rooms.push('single')
    if (has(text, /\bdouble\b|twin|2 sharing|two sharing/)) rooms.push('double')
    if (has(text, /\btriple\b|3 sharing|three sharing/)) rooms.push('triple')
    if (has(text, /\bdorm/)) rooms.push('dorm')
    if (rooms.length) f.room_type = rooms.join(',')
    if (has(text, /\bac\b|air[- ]?condition/) && !has(text, /non[- ]?ac\b/)) f.ac = 'true'
    if (has(text, /attached (bath|bathroom|toilet|washroom)|own bathroom|private bathroom/)) f.attached_bathroom = 'true'
    if (has(text, /available (now|immediately)|immediate|vacancy|vacant|free beds?|move in (this|next) (week|month)/)) f.available_now = 'true'

    // ---------- wi-fi & amenities ----------
    if (has(text, /wi-?fi|internet|broadband/)) {
      if (has(text, /fast|good|high[- ]speed|strong|reliable|work from home|\bwfh\b/)) f.wifi_min_mbps = '100'
      else f.wifi_free = 'true'
    } else if (has(text, /work from home|\bwfh\b/)) f.wifi_min_mbps = '100'
    if (has(text, /laundry|washing machine/)) f.laundry = 'true'
    if (has(text, /power backup|inverter|generator|power cuts?/)) f.power_backup = 'true'
    if (has(text, /hot water|geyser/)) f.hot_water_24h = 'true'

    // ---------- food ----------
    if (has(text, /no food|without food|no mess|self[- ]?cook|cook (my|our) own|own cooking|common kitchen/)) f.food_included = 'none'
    else if (has(text, /with food|food included|meals?|\bmess\b|\bfood\b|tiffin/)) f.food_included = 'included,optional'
    if (has(text, /pure veg|veg only|vegetarian|\bveg\b(?! and)/) && !has(text, /non[- ]?veg/)) f.veg_options = 'veg_only'
    else if (has(text, /non[- ]?veg|fish|chicken|meat|egg/)) f.veg_options = 'both'
    const cuisines: string[] = []
    if (has(text, /kerala|malayali|nadan|fish curry|sadya/)) cuisines.push('kerala')
    if (has(text, /north indian|roti|chapati|paneer/)) cuisines.push('north_indian')
    if (has(text, /south indian|dosa|idli/)) cuisines.push('south_indian')
    if (cuisines.length) f.cuisine = cuisines.join(',')

    // ---------- cleaning ----------
    if (has(text, /daily (cleaning|housekeeping)|cleaned daily|clean(ed)? every day/)) f.cleaning_min_per_week = '6'
    else if (has(text, /\bclean\b|hygien|housekeeping/)) f.cleaning_min_per_week = '3'
    if (has(text, /garbage|waste/)) f.garbage = 'daily'

    // ---------- rules ----------
    if (has(text, /no curfew|without (a )?curfew|no (time|timing) restrictions?|no restrictions/)) f.curfew_type = 'none'
    else if (has(text, /flexible (curfew|timing|timings)/)) f.curfew_type = 'none,flexible'
    if (has(text, /late (entry|night|return)|come back late|flexible late|night shift|late shift|\bshifts?\b/)) f.late_entry = 'flexible,with_permission'
    const gate = text.match(/(?:till|until|after|open (?:till|until)|by)\s*(\d{1,2})(?::(\d{2}))?\s*(pm|p\.m\.)?/)
    if (gate && (gate[3] || /gate|curfew|late|back/.test(text))) {
      let h = Number(gate[1])
      if (h < 12) h += 12
      const opt = h >= 23 ? '23:00' : h >= 22 ? '22:00' : h >= 21 ? '21:00' : null
      if (opt) f.gate_close_after = opt
    }
    if (has(text, /visitors? (allowed|ok)|friends can (visit|come)|guests? allowed|parents can visit/)) f.visitors = 'reception_only,daytime_only,with_notice'

    // ---------- safety features (never a score) ----------
    if (has(text, /cctv|camera/)) f.cctv_min = 'common_areas'
    if (has(text, /24\s*[x/*]\s*7|round the clock|security guard|\bguard\b|watchman/)) f.guard_24x7 = 'true'
    if (has(text, /warden|matron/)) f.female_warden = 'true'
    if (has(text, /biometric|keycard|key card|fingerprint/)) f.biometric_entry = 'true'
    if (has(text, /main road|well[- ]lit|lit road/)) f.main_road_within_m = '200'

    // ---------- place ----------
    const landmark = findLandmark(text, ctx.landmarks)
    const named = (kind: string) => ctx.landmarks.filter((l) => l.kind === kind).map((l) => l.name)
    const orList = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}` : xs[0])
    if (landmark) {
      f.near_landmark = landmark
      const mins = text.match(/(\d{1,2})\s*(?:min|mins|minutes)/)
      const walk = has(text, /walk(ing|able)?/)
      f.commute_mode = walk ? 'walk' : has(text, /\bbus\b/) ? 'bus' : 'auto'
      f.max_minutes = mins ? String(Math.min(30, Math.max(5, Math.round(Number(mins[1]) / 5) * 5))) : '15'
    } else if (has(text, /near (my )?(college|campus)/) && named('campus').length) {
      ask(`Which college? ${orList(named('campus'))}?`)
    } else if (has(text, /near (my )?(office|it park|tech park|work)/) && named('it_park').length) {
      ask(`Which workplace? ${orList(named('it_park'))}?`)
    }
    const landmarkTerms = landmark ? ctx.landmarks.filter((l) => l.slug === landmark).flatMap((l) => [l.name, ...l.aliases].map(norm)) : []
    for (const s of ctx.subAreas) {
      // "near Civil Station" is a landmark, not also a locality filter.
      if (text.includes(s.name.toLowerCase()) && !landmarkTerms.some((t) => t.includes(s.name.toLowerCase()))) {
        if (s.hasListings) f.sub_area = f.sub_area ? `${f.sub_area},${s.slug}` : s.slug
        else unsupported.push({ text: s.name, reason: `We don’t have listings in ${s.name} yet.` })
      }
    }

    // ---------- verification & ratings ----------
    if (has(text, /verified/)) f.verified_only = 'true'
    const stars = text.match(/(\d(?:\.\d)?)\s*(?:\+|star|stars|★)/)
    if (stars && Number(stars[1]) >= 3 && Number(stars[1]) <= 5) f.min_rating = Number(stars[1]) >= 4 ? '4' : Number(stars[1]) >= 3.5 ? '3.5' : '3'
    else if (has(text, /highly rated|top rated|good reviews|well reviewed|best rated/)) f.min_rating = '4'

    // ---------- unsupported ----------
    for (const [re, label, reason] of UNSUPPORTED) {
      if (re.test(text)) {
        if (label === 'cheap' && (f.rent_max || f.rent_min)) continue
        if (label === 'safe' && (f.cctv_min || f.guard_24x7 || f.female_warden || f.biometric_entry || f.main_road_within_m)) {
          unsupported.push({ text: label, reason: 'There’s no single safety score. We used the specific features you mentioned.' })
          continue
        }
        unsupported.push({ text: label, reason })
        if (label === 'cheap') ask('What’s your monthly budget per bed? For example, under 8000.')
      }
    }

    return { query, filters: f, unsupported, clarification, out_of_coverage: null }
  },
}

/** Load the context an interpreter needs from the database. */
export function interpretContext(db: DB): InterpretContext {
  const area = db.prepare('SELECT slug, name, district FROM areas WHERE slug = ?').get(config.activeArea) as InterpretContext['activeArea']
  return {
    activeArea: area ?? { slug: config.activeArea, name: config.activeArea, district: '' },
    comingSoon: db.prepare(`SELECT slug, name FROM areas WHERE status = 'coming_soon' ORDER BY name`).all() as InterpretContext['comingSoon'],
    subAreas: (
      db
        .prepare(
          `SELECT s.slug, s.name, EXISTS (SELECT 1 FROM properties p WHERE p.sub_area_id = s.id) AS has_listings
           FROM sub_areas s JOIN areas a ON a.id = s.area_id WHERE a.slug = ?`,
        )
        .all(config.activeArea) as { slug: string; name: string; has_listings: number }[]
    ).map((s) => ({ slug: s.slug, name: s.name, hasListings: s.has_listings === 1 })),
    landmarks: (
      db
        .prepare('SELECT l.slug, l.name, l.kind, l.aliases FROM landmarks l JOIN areas a ON a.id = l.area_id WHERE a.slug = ? ORDER BY l.display_order')
        .all(config.activeArea) as { slug: string; name: string; kind: string; aliases: string }[]
    ).map((l) => ({ ...l, aliases: parseJson<string[]>(l.aliases, []) })),
  }
}

/**
 * The trust boundary. Drops any key the registry doesn't know, any option value it doesn't offer,
 * and builds the human-readable chips from registry labels.
 */
export function sanitize(db: DB, draft: Omit<InterpretResult, 'chips'>): InterpretResult {
  const reg = registry(db)
  const filters: FilterValues = {}
  const chips: InterpretChip[] = []
  const unsupported = [...draft.unsupported]
  const inr = (n: string) => `₹${Number(n).toLocaleString('en-IN')}`

  for (const def of reg) {
    if (!def.supported) continue
    if (def.kind === 'range' && def.range) {
      const lo = draft.filters[def.range.min_key]
      const hi = draft.filters[def.range.max_key]
      if (lo && Number(lo) > 0) filters[def.range.min_key] = String(Number(lo))
      if (hi && Number(hi) > 0) filters[def.range.max_key] = String(Number(hi))
      if (filters.rent_min && filters.rent_max) chips.push({ key: 'rent', value: `${filters.rent_min}-${filters.rent_max}`, label: `${inr(filters.rent_min)}–${inr(filters.rent_max)} a month` })
      else if (filters.rent_max) chips.push({ key: 'rent', value: `-${filters.rent_max}`, label: `Up to ${inr(filters.rent_max)} a month` })
      else if (filters.rent_min) chips.push({ key: 'rent', value: `${filters.rent_min}-`, label: `From ${inr(filters.rent_min)} a month` })
      continue
    }
    const raw = draft.filters[def.key]
    if (!raw) continue
    if (def.kind === 'boolean') {
      if (raw === 'true') {
        filters[def.key] = 'true'
        chips.push({ key: def.key, value: 'true', label: def.label })
      }
      continue
    }
    const allowed = new Map((def.options ?? []).map((o) => [o.value, o.label]))
    const values = raw.split(',').filter((v) => allowed.has(v))
    if (!values.length) continue
    const value = def.kind === 'single' ? values[0] : values.join(',')
    filters[def.key] = value
    if (def.kind === 'commute') {
      const mode = ['walk', 'auto', 'bus'].includes(draft.filters.commute_mode) ? draft.filters.commute_mode : 'auto'
      const mins = Number(draft.filters.max_minutes) > 0 ? draft.filters.max_minutes : '15'
      filters.commute_mode = mode
      filters.max_minutes = mins
      chips.push({ key: def.key, value, label: `Within ${mins} min of ${allowed.get(value)} by ${mode === 'walk' ? 'walking' : mode}` })
      continue
    }
    const labels = value.split(',').map((v) => allowed.get(v)!)
    const joined = labels.join(' or ')
    chips.push({ key: def.key, value, label: def.kind === 'single' || !['type', 'gender_policy'].includes(def.key) ? `${def.label}: ${joined}` : joined })
  }

  // Anything the draft proposed that the registry doesn't support is reported, never silently applied.
  const known = new Set(reg.filter((d) => d.supported).flatMap((d) => (d.kind === 'range' ? [d.range!.min_key, d.range!.max_key] : d.kind === 'commute' ? [d.key, 'max_minutes', 'commute_mode'] : [d.key])))
  for (const k of Object.keys(draft.filters)) {
    if (!known.has(k)) unsupported.push({ text: k, reason: 'Not a filter we support yet.' })
  }

  return { ...draft, filters: draft.out_of_coverage ? {} : filters, chips: draft.out_of_coverage ? [] : chips, unsupported }
}

export function interpretQuery(db: DB, query: string, interpreter: Interpreter = ruleBasedInterpreter): InterpretResult {
  const q = String(query ?? '').slice(0, 500)
  if (!q.trim()) return { query: q, filters: {}, chips: [], unsupported: [], clarification: 'Tell us what you’re looking for, for example “women’s PG near Infopark under 9000 with food”.', out_of_coverage: null }
  return sanitize(db, interpreter.interpret(q, interpretContext(db)))
}
