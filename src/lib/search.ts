import { PropertyType } from '../data/properties'

export interface ParsedIntent {
  locality?: string
  city?: string
  type?: PropertyType
  maxBudget?: number
  food?: 'veg' | 'nonveg' | 'any'
  withFood?: boolean
  ac?: boolean
  curfew?: 'none' | 'flexible'
  room?: string
  chips: { label: string }[]
  terms: string[]
}

const KNOWN_LOCALITIES: [string, string][] = [
  ['infopark', 'Infopark Road'],
  ['chittethukara', 'Chittethukara'],
  ['kusumagiri', 'Kusumagiri'],
  ['thrikkakara', 'Thrikkakara'],
  ['edachira', 'Edachira'],
  ['padamugal', 'Padamugal'],
  ['vazhakkala', 'Vazhakkala'],
]

const KNOWN_CITIES: [string, string][] = [['kakkanad', 'Kakkanad']]

const BUDGET_WORDS = [
  'under',
  'below',
  'upto',
  'up to',
  'within',
  'less than',
  'around',
  'about',
  'max',
  'till',
  'budget',
]

/** Parse a free-text, conversational accommodation query into structured intent. */
export function parseQuery(raw: string): ParsedIntent {
  const text = raw.toLowerCase().trim()
  const words = text.split(/[^a-z0-9₹./]+/).filter(Boolean)
  const chips: { label: string }[] = []
  const terms: string[] = []
  const intent: ParsedIntent = { chips, terms }

  // --- budget: "under 15000", "15k", "₹12,000", "1.2 lakh" ---
  const budgetMatch = text.match(
    /(?:under|below|upto|up\s*to|within|less\s*than|around|about|max|budget\s*(?:of|is|:)?|₹|rs\.?)\s*(\d+(?:[.,]\d+)?)\s*(k|lakh|l)?\b/,
  )
  if (budgetMatch) {
    let value = parseFloat(budgetMatch[1].replace(/,/g, ''))
    const unit = budgetMatch[2]
    if (unit === 'k') value *= 1000
    if (unit === 'lakh' || unit === 'l') value *= 100000
    if (value > 0 && value < 1000) value *= 1000 // "15k" without k
    if (value >= 2000 && value <= 200000) {
      intent.maxBudget = Math.round(value)
      chips.push({ label: `Budget ≤ ₹${Math.round(value).toLocaleString('en-IN')}` })
    }
  }

  // --- type ---
  if (/\bpg\b|paying guest/.test(text)) {
    intent.type = 'PG'
    chips.push({ label: 'PG' })
  } else if (/\bhostel\b|ladies hostel|girls hostel/.test(text)) {
    intent.type = 'Hostel'
    chips.push({ label: 'Hostel' })
  } else if (/shared rental|shared flat|coliving|co-living|flat with flatmates|room in a flat/.test(text)) {
    intent.type = 'Shared Rental'
    chips.push({ label: 'Shared Rental' })
  }

  // --- locality / city ---
  for (const [key, label] of KNOWN_LOCALITIES) {
    if (text.includes(key)) {
      intent.locality = label
      chips.push({ label })
      terms.push(label)
      break
    }
  }
  if (!intent.locality) {
    for (const [key, label] of KNOWN_CITIES) {
      if (text.includes(key)) {
        intent.city = label
        chips.push({ label })
        break
      }
    }
  }

  // --- food ---
  if (/(no|without)\s*(food|mess)/.test(text)) {
    intent.withFood = false
    chips.push({ label: 'Without food' })
  } else if (/(with\s*)?(food|mess|meals|tiffin)/.test(text)) {
    intent.withFood = true
    chips.push({ label: 'With food' })
    if (/veg(eterian)?\b/.test(text) && !/non[- ]?veg/.test(text)) {
      intent.food = 'veg'
      chips.push({ label: 'Veg food' })
    } else if (/non[- ]?veg/.test(text)) {
      intent.food = 'nonveg'
      chips.push({ label: 'Non-veg food' })
    }
  }

  // --- AC ---
  if (/\bac\b|air[- ]?condit/.test(text)) {
    intent.ac = true
    chips.push({ label: 'AC rooms' })
  }

  // --- curfew ---
  if (/no curfew|without curfew|open all night|flexible curfew|late curfew/.test(text)) {
    intent.curfew = /no curfew|without curfee/.test(text) ? 'none' : 'flexible'
    chips.push({ label: intent.curfew === 'none' ? 'No curfew' : 'Flexible curfew' })
  }

  // --- room type ---
  if (/single\s*(sharing|room)|1\s*sharing/.test(text)) {
    intent.room = 'Single sharing'
    chips.push({ label: 'Single sharing' })
  } else if (/double\s*(sharing|room)|2\s*sharing/.test(text)) {
    intent.room = 'Double sharing'
    chips.push({ label: 'Double sharing' })
  } else if (/triple|3\s*sharing/.test(text)) {
    intent.room = 'Triple sharing'
    chips.push({ label: 'Triple sharing' })
  }

  // leftover meaningful words for keyword search
  const stopwords = new Set([
    ...BUDGET_WORDS,
    'pg',
    'hostel',
    'in',
    'near',
    'a',
    'an',
    'the',
    'for',
    'me',
    'my',
    'with',
    'and',
    'want',
    'need',
    'looking',
    'please',
    'find',
    'good',
    'best',
    'ok',
    'okay',
    'where',
    'what',
    'safe',
    'room',
    'rooms',
    'place',
    'stay',
    'accommodation',
    'city',
    'k',
    'lakh',
    'l',
    'rent',
    'monthly',
    'month',
    'women',
    'ladies',
    'girl',
    'girls',
  ])
  words.forEach((w) => {
    if (w.length > 2 && !stopwords.has(w) && !/^\d+$/.test(w) && !terms.includes(w)) terms.push(w)
  })

  return intent
}
