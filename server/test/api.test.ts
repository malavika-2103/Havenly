// End-to-end API tests against a freshly seeded temporary database.
// Run with: npm test
import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

// Point the server at a throwaway database before any server module reads config.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'havenly-test-'))
process.env.DB_PATH = path.join(dir, 'test.db')
process.env.ADMIN_TOKEN = 'test-admin-token'

const { seed } = await import('../seed/seed')
const { createApp } = await import('../src/app')
const { getDb } = await import('../src/db')

let server: Server
let base = ''
const ADMIN = { 'X-Admin-Token': 'test-admin-token', 'Content-Type': 'application/json' }

async function call(method: string, url: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, text }
}
const get = (url: string, headers?: Record<string, string>) => call('GET', url, undefined, headers)
const post = (url: string, body?: unknown, headers?: Record<string, string>) => call('POST', url, body ?? {}, headers)

async function login(name = 'Test user') {
  const r = await post('/api/auth/demo-login', { display_name: name })
  return { Authorization: `Bearer ${r.body.token}` }
}

/** A move-in date `days` from today in YYYY-MM-DD (IST). */
const inDays = (days: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + days * 86400_000))

before(() => {
  seed()
  server = createApp().listen(0)
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
after(() => {
  server.close()
  getDb().close()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('filters', () => {
  test('every supported filter narrows results, and facet counts match the applied result', async () => {
    const all = await get('/api/properties?limit=50')
    const total = all.body.total
    assert.equal(total, 16)
    const { body: reg } = await get('/api/filters')
    for (const f of reg.filters) {
      if (!f.supported || f.kind === 'range' || f.kind === 'commute') continue
      const options = f.kind === 'boolean' ? ['true'] : f.options.map((o: any) => o.value)
      let narrowest = Infinity
      for (const v of options) {
        const r = await get(`/api/properties?${f.key}=${encodeURIComponent(v)}&limit=50`)
        assert.equal(r.status, 200)
        assert.equal(r.body.total, all.body.facets[f.key][v], `facet count for ${f.key}=${v}`)
        assert.ok(r.body.total <= total)
        narrowest = Math.min(narrowest, r.body.total)
      }
      assert.ok(narrowest < total, `${f.key} should narrow results`)
    }
  })

  test('every budget bucket returns results and stays inside the range', async () => {
    const { body: reg } = await get('/api/filters')
    const rent = reg.filters.find((f: any) => f.key === 'rent')
    for (const p of rent.range.presets) {
      const q = new URLSearchParams()
      if (p.min) q.set('rent_min', String(p.min))
      if (p.max) q.set('rent_max', String(p.max))
      const r = await get(`/api/properties?${q}&limit=50`)
      assert.ok(r.body.total > 0, `bucket ${p.label} has results`)
      assert.ok(r.body.total < 16, `bucket ${p.label} narrows`)
    }
  })

  test('commute filter narrows to places within the limit', async () => {
    const r = await get('/api/properties?near_landmark=infopark-phase-1&max_minutes=10&commute_mode=auto&limit=50')
    assert.ok(r.body.total > 0 && r.body.total < 16)
    for (const p of r.body.results) {
      const d = await get(`/api/properties/${p.slug}`)
      const c = d.body.commute.find((x: any) => x.landmark.slug === 'infopark-phase-1')
      assert.ok(c.minutes_auto <= 10)
    }
  })

  test('unknown query params are reported as ignored, not applied', async () => {
    const r = await get('/api/properties?gym=true&swimming=1')
    assert.equal(r.body.total, 16)
    assert.deepEqual(r.body.ignored.sort(), ['gym', 'swimming'])
  })
})

describe('search interpretation', () => {
  test('a Kakkanad query becomes registry filters only', async () => {
    const r = await post('/api/search/interpret', { query: "Women's PG near Infopark under 9000 with food" })
    assert.equal(r.body.out_of_coverage, null)
    assert.equal(r.body.filters.type, 'PG')
    assert.equal(r.body.filters.gender_policy, 'women_only')
    assert.equal(r.body.filters.rent_max, '9000')
    assert.equal(r.body.filters.near_landmark, 'infopark-phase-1')
    const { body: reg } = await get('/api/filters')
    const keys = new Set(reg.filters.flatMap((f: any) => (f.range ? [f.range.min_key, f.range.max_key] : f.commute ? [f.key, 'max_minutes', 'commute_mode'] : [f.key])))
    for (const k of Object.keys(r.body.filters)) assert.ok(keys.has(k), `${k} is a registry key`)
  })

  test('unsupported wishes are reported, never turned into filters', async () => {
    const r = await post('/api/search/interpret', { query: 'quiet hostel near the beach with a gym' })
    const texts = r.body.unsupported.map((u: any) => u.text)
    assert.ok(texts.includes('gym') && texts.includes('quiet') && texts.includes('views or beach'))
    assert.equal(r.body.filters.gym, undefined)
  })

  test('another city is out of coverage and returns no filters', async () => {
    for (const q of ['PG in Bangalore under 10k', 'ladies hostel in Chennai']) {
      const r = await post('/api/search/interpret', { query: q })
      assert.ok(r.body.out_of_coverage)
      assert.equal(r.body.out_of_coverage.coming_soon, false)
      assert.deepEqual(r.body.filters, {})
      assert.deepEqual(r.body.chips, [])
    }
  })

  test('a coming-soon area is out of coverage with a waitlist slug', async () => {
    const r = await post('/api/search/interpret', { query: 'hostel in Vyttila' })
    assert.equal(r.body.out_of_coverage.coming_soon, true)
    assert.equal(r.body.out_of_coverage.area_slug, 'vyttila')
    assert.deepEqual(r.body.filters, {})
  })

  test('at most one clarifying question', async () => {
    const r = await post('/api/search/interpret', { query: 'cheap PG near my college' })
    assert.equal(typeof r.body.clarification, 'string')
    assert.ok(!Array.isArray(r.body.clarification))
  })
})

describe('compare', () => {
  test('caps at 3 places', async () => {
    const r = await get('/api/compare?ids=tulsi-nest-womens-pg,kayal-house-ladies-hostel,coconut-grove-coliving,nila-womens-hostel')
    assert.equal(r.status, 400)
    assert.equal(r.body.error.code, 'COMPARE_LIMIT')
  })

  test('returns aligned rows with differences and no safety score', async () => {
    const r = await get('/api/compare?ids=tulsi-nest-womens-pg,kayal-house-ladies-hostel,coconut-grove-coliving')
    assert.equal(r.status, 200)
    assert.equal(r.body.properties.length, 3)
    for (const row of r.body.rows) assert.equal(row.values.length, 3)
    assert.ok(r.body.rows.some((row: any) => row.differs))
    assert.ok(!/safety_score|safety score"/i.test(r.text.replace(r.body.note, '')))
  })
})

describe('estimates', () => {
  test('estimate lines match the database exactly', async () => {
    const db = getDb()
    const p = db.prepare(`SELECT * FROM properties WHERE slug = 'harbour-line-mens-hostel'`).get() as any
    const room = db.prepare(`SELECT * FROM room_inventory WHERE property_id = ? AND room_type = 'double'`).get(p.id) as any
    const charges = JSON.parse(p.other_charges) as { amount: number; frequency: string }[]
    const months = 6
    const r = await post('/api/properties/harbour-line-mens-hostel/estimate', { room_type: 'double', move_in_date: inDays(20), duration_months: months, include_mess: true })
    assert.equal(r.status, 200)
    const expected =
      room.rent_per_bed * months +
      room.mess_cost_per_month * months +
      p.maintenance_charge * months +
      charges.reduce((s, c) => s + c.amount * (c.frequency === 'monthly' ? months : c.frequency === 'yearly' ? Math.ceil(months / 12) : 1), 0) +
      p.security_deposit
    assert.equal(r.body.estimated_total, expected)
    assert.equal(r.body.lines.find((l: any) => l.key === 'rent').amount, room.rent_per_bed * months)
    assert.equal(r.body.lines.find((l: any) => l.key === 'mess').amount, room.mess_cost_per_month * months)
    assert.equal(r.body.refundable_total, p.security_deposit)
  })

  test('mess is not added where the room has no mess cost', async () => {
    const r = await post('/api/properties/kayal-house-ladies-hostel/estimate', { room_type: 'double', move_in_date: inDays(20), duration_months: 6, include_mess: true })
    assert.equal(r.body.include_mess, false)
    assert.ok(!r.body.lines.some((l: any) => l.kind === 'mess'))
  })

  test('resident-reported hidden costs are surfaced next to the estimate', async () => {
    const r = await post('/api/properties/mango-leaf-pg-for-women/estimate', { room_type: 'triple', move_in_date: inDays(20), duration_months: 6 })
    assert.equal(r.body.resident_reported_costs.length, 1)
  })

  test('rejects invalid dates, durations and room types', async () => {
    const bad = [
      [{ room_type: 'double', move_in_date: inDays(0), duration_months: 6 }, 'INVALID_MOVE_IN'],
      [{ room_type: 'double', move_in_date: inDays(-5), duration_months: 6 }, 'INVALID_MOVE_IN'],
      [{ room_type: 'double', move_in_date: inDays(91), duration_months: 6 }, 'INVALID_MOVE_IN'],
      [{ room_type: 'double', move_in_date: inDays(20), duration_months: 2 }, 'INVALID_DURATION'],
      [{ room_type: 'double', move_in_date: inDays(20), duration_months: 13 }, 'INVALID_DURATION'],
      [{ room_type: 'single', move_in_date: inDays(20), duration_months: 6 }, 'ROOM_TYPE_NOT_FOUND'],
    ] as const
    for (const [body, code] of bad) {
      const r = await post('/api/properties/kayal-house-ladies-hostel/estimate', body)
      assert.equal(r.status, 400, JSON.stringify(body))
      assert.equal(r.body.error.code, code)
    }
  })
})

describe('booking requests', () => {
  test('requires sign-in', async () => {
    const r = await post('/api/bookings', { property_slug: 'kayal-house-ladies-hostel', room_type: 'double', move_in_date: inDays(20), duration_months: 6 })
    assert.equal(r.status, 401)
  })

  test('rejects full rooms and offers the waitlist', async () => {
    const auth = await login()
    const r = await post('/api/bookings', { property_slug: 'tulsi-nest-womens-pg', room_type: 'single', move_in_date: inDays(20), duration_months: 6 }, auth)
    assert.equal(r.status, 409)
    assert.equal(r.body.error.code, 'ROOM_FULL')
    assert.equal(r.body.error.details.waitlist_open, true)
    const w = await post('/api/properties/tulsi-nest-womens-pg/waitlist', { room_type: 'single' }, auth)
    assert.equal(w.status, 201)
  })

  test('rejects invalid dates', async () => {
    const auth = await login()
    const r = await post('/api/bookings', { property_slug: 'kayal-house-ladies-hostel', room_type: 'double', move_in_date: inDays(120), duration_months: 6 }, auth)
    assert.equal(r.status, 400)
    assert.equal(r.body.error.code, 'INVALID_MOVE_IN')
  })

  test('creates a request with a server reference and estimate snapshot; repeat submits are idempotent; duplicates are blocked', async () => {
    const auth = await login()
    const body = { property_slug: 'ixora-ladies-pg', room_type: 'double', move_in_date: inDays(15), duration_months: 6 }
    const first = await post('/api/bookings', body, { ...auth, 'Idempotency-Key': 'k1' })
    assert.equal(first.status, 201)
    const b = first.body.booking
    assert.match(b.reference, /^HV-[2-9A-Z]{4}-[2-9A-Z]{4}$/)
    assert.equal(b.status, 'submitted')
    assert.equal(b.estimate.property_slug, 'ixora-ladies-pg')
    assert.ok(Date.parse(b.expires_at) > Date.now() + 70 * 3600_000)

    const replay = await post('/api/bookings', body, { ...auth, 'Idempotency-Key': 'k1' })
    assert.equal(replay.status, 200)
    assert.equal(replay.body.booking.reference, b.reference)

    const dup = await post('/api/bookings', body, { ...auth, 'Idempotency-Key': 'k2' })
    assert.equal(dup.status, 409)
    assert.equal(dup.body.error.code, 'DUPLICATE_REQUEST')
  })

  test('a request holds no bed until the owner accepts; cancel after accept frees it', async () => {
    const db = getDb()
    const beds = () => (db.prepare(`SELECT available_beds AS n FROM room_inventory WHERE id = 'room_jasmine_court_working_womens_pg_double'`).get() as any).n
    const start = beds()
    const auth = await login()
    const r = await post('/api/bookings', { property_slug: 'jasmine-court-working-womens-pg', room_type: 'double', move_in_date: inDays(10), duration_months: 6 }, auth)
    assert.equal(beds(), start)
    const ref = r.body.booking.reference
    assert.equal((await post(`/api/admin/bookings/${ref}/status`, { status: 'owner_notified' }, ADMIN)).status, 200)
    const acc = await post(`/api/admin/bookings/${ref}/status`, { status: 'accepted' }, ADMIN)
    assert.equal(acc.body.status, 'accepted')
    assert.equal(beds(), start - 1)
    const mine = await get('/api/bookings', auth)
    assert.equal(mine.body.results[0].status, 'accepted')
    const cancel = await post(`/api/bookings/${ref}/cancel`, {}, auth)
    assert.equal(cancel.body.status, 'cancelled_by_user')
    assert.equal(beds(), start)
  })

  test('admin endpoints need the admin token', async () => {
    assert.equal((await get('/api/admin/bookings')).status, 401)
    assert.equal((await get('/api/admin/bookings', { 'X-Admin-Token': 'wrong-token-value' })).status, 401)
  })
})

describe('privacy and honesty', () => {
  test('owner contact fields never appear in public responses', async () => {
    const owners = getDb().prepare('SELECT owner_name, phone, email FROM owners').all() as any[]
    const secrets = owners.flatMap((o) => [o.owner_name, o.phone, o.email])
    const auth = await login()
    const { body: list } = await get('/api/properties?limit=50')
    const urls = ['/api/meta', '/api/filters', '/api/properties?limit=50', '/api/reviews?limit=100', '/api/compare?ids=tulsi-nest-womens-pg,nila-womens-hostel']
    for (const p of list.results) urls.push(`/api/properties/${p.slug}`, `/api/properties/${p.slug}/reviews`)
    for (const u of [...urls, '/api/saved', '/api/bookings']) {
      const r = await get(u, auth)
      assert.equal(r.status, 200, u)
      assert.ok(!/"(owner_name|owner_phone|owner_email|phone)"\s*:/.test(r.text), `owner field in ${u}`)
      for (const s of secrets) assert.ok(!r.text.includes(s), `owner value in ${u}`)
    }
  })

  test("an unverified user's review is not shown as verified, even after moderation", async () => {
    const auth = await login('Reviewer without proof')
    const created = await post(
      '/api/reviews',
      { property_slug: 'palm-shade-mens-hostel', overall_rating: 4, title: 'Decent for the price', body: 'The rooms are basic but the food is good and the rent is fair for students.', review_type: 'general' },
      auth,
    )
    assert.equal(created.status, 201)
    assert.equal(created.body.verified_resident, false)
    // Not public while pending.
    let list = await get('/api/properties/palm-shade-mens-hostel/reviews')
    assert.ok(!list.body.results.some((r: any) => r.id === created.body.id))
    // Approved by a moderator: public, but still not verified.
    await post(`/api/admin/reviews/${created.body.id}/moderate`, { status: 'approved' }, ADMIN)
    list = await get('/api/properties/palm-shade-mens-hostel/reviews')
    const mine = list.body.results.find((r: any) => r.id === created.body.id)
    assert.ok(mine)
    assert.equal(mine.verified_resident, false)
    assert.equal(mine.is_sample, false)
  })

  test('only places with platform_verified provenance show the Verified badge', async () => {
    const { body } = await get('/api/properties?limit=50')
    const db = getDb()
    for (const p of body.results) {
      const n = (db.prepare(`SELECT COUNT(*) AS n FROM fact_provenance WHERE property_id = ? AND source = 'platform_verified'`).get(p.id) as any).n
      if (p.verified_badge) assert.ok(n > 0, p.slug)
    }
    assert.equal(body.results.filter((p: any) => p.verified_badge).length, 3)
  })

  test('admin cannot mark a place verified without evidence', async () => {
    const r = await post('/api/admin/properties/prop_greenline_mens_hostel/verification', { status: 'verified' }, ADMIN)
    assert.equal(r.status, 409)
    assert.equal(r.body.error.code, 'NO_EVIDENCE')
  })

  test('fewer than 3 reviews shows "not enough reviews yet" instead of a rating', async () => {
    const r = await get('/api/properties/anjili-womens-hostel')
    assert.equal(r.body.rating, null)
    assert.equal(r.body.review_summary.enough, false)
  })

  test('purge removes every demo row', async () => {
    const r = await post('/api/admin/purge-demo', { confirm: 'PURGE' }, ADMIN)
    assert.ok(r.body.removed.properties === 16)
    const left = getDb().prepare(`SELECT COUNT(*) AS n FROM properties WHERE data_source = 'demo_seed'`).get() as any
    assert.equal(left.n, 0)
    seed() // restore for any later test
  })
})
