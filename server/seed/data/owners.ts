// ADMIN-ONLY owner contacts. Obviously fake: 555-style numbers and example.com emails. Never returned publicly.
import { properties } from './properties'

const OWNER_NAMES = [
  'Demo Owner A',
  'Demo Owner B',
  'Demo Owner C',
  'Demo Owner D',
  'Demo Owner E',
  'Demo Owner F',
  'Demo Owner G',
  'Demo Owner H',
  'Demo Owner I',
  'Demo Owner J',
  'Demo Owner K',
  'Demo Owner L',
  'Demo Owner M',
  'Demo Owner N',
  'Demo Owner O',
  'Demo Owner P',
]

export const owners = properties.map((p, i) => ({
  property_slug: p.slug,
  owner_name: OWNER_NAMES[i],
  phone: `+91 555 010 ${String(1000 + i).slice(-4)}`,
  email: `owner-${p.slug}@example.com`,
}))
