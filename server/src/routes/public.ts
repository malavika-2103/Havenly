import { Router } from 'express'
import crypto from 'node:crypto'
import { getDb, nowIso } from '../db'
import { config } from '../config'
import { route, badRequest, notFound } from '../lib/http'
import { demoLogin, requireUser } from '../auth'
import { filtersResponse } from '../services/filters'
import { compareProperties, getPropertyDetail, listProperties, toSummary } from '../services/properties'
import { createReview, listReviews, reportReview, voteHelpful } from '../services/reviews'
import { interpretQuery } from '../services/interpret'
import { computeEstimate, validateEstimateInput } from '../services/estimate'
import { cancelBooking, createBooking, getBooking, joinWaitlist, listBookings } from '../services/bookings'
import { checkWebRateLimit, searchWeb } from '../services/webSearch'
import { checkPushTestLimit, notifyUser, removeSubscription, saveSubscription, vapidKeys } from '../services/push'
import type { AreaInfo, Meta } from '../../../shared/types'

export const DEMO_NOTICE = 'Demo data for presentation. Listings and reviews are fictional samples.'

export function publicRoutes() {
  const r = Router()
  const db = () => getDb()

  r.get('/health', route(() => ({ ok: true })))

  r.get(
    '/meta',
    route((): Meta => {
      const areas = db().prepare('SELECT slug, name, district, state, status FROM areas ORDER BY name').all() as Meta['coming_soon']
      const active = areas.find((a) => a.slug === config.activeArea && a.status === 'active')
      if (!active) throw notFound(`The configured area “${config.activeArea}” has no data. Run npm run seed.`)
      const demo = config.demoMode || !!db().prepare(`SELECT 1 FROM properties WHERE data_source = 'demo_seed' LIMIT 1`).get()
      const lm = db()
        // Featured landmarks (lowest display_order) come first.
        .prepare(
          `SELECT l.name FROM landmarks l JOIN areas a ON a.id = l.area_id WHERE a.slug = ?
           ORDER BY l.display_order, l.name`,
        )
        .all(config.activeArea)
        .map((l: any) => l.name as string)
      const it = lm[0] ?? active.name
      const second = lm.find((n) => n !== it && !n.startsWith(it.split(' ')[0])) ?? it
      const example_searches = [
        `Women's PG near ${it.replace(/ Phase 1$/, '')} under 9000 with food`,
        `Hostel in ${active.name} with flexible late entry and Wi-Fi`,
        `Shared rental near ${second} with attached bathroom`,
        `Working women's hostel with a 24x7 guard and a warden`,
      ]
      return {
        active_area: active,
        coming_soon: areas.filter((a) => a.status === 'coming_soon'),
        demo,
        demo_notice: demo ? DEMO_NOTICE : null,
        example_searches,
        payments_enabled: false,
      }
    }),
  )

  r.get('/filters', route(() => filtersResponse(db())))

  r.get('/properties', route((req) => listProperties(db(), req.query as Record<string, unknown>)))
  r.get('/properties/:slug', route((req) => getPropertyDetail(db(), req.params.slug)))
  r.get(
    '/properties/:slug/reviews',
    route((req) => {
      getPropertyDetail(db(), req.params.slug) // 404 if outside the active area
      return listReviews(db(), { slug: req.params.slug, type: req.query.type as string, sort: req.query.sort as string, limit: Number(req.query.limit) || 50 })
    }),
  )
  r.get('/reviews', route((req) => listReviews(db(), { type: req.query.type as string, sort: req.query.sort as string, limit: Number(req.query.limit) || 20 })))

  r.post('/reviews', requireUser, route((req) => createReview(db(), req.user!.id, req.user!.display_name, req.body), 201))
  r.post('/reviews/:id/helpful', requireUser, route((req) => voteHelpful(db(), req.user!.id, req.params.id)))
  r.post('/reviews/:id/report', requireUser, route((req) => reportReview(db(), req.user!.id, req.params.id, req.body?.reason)))

  r.post(
    '/residency',
    requireUser,
    route((req) => {
      const p = db().prepare('SELECT id FROM properties WHERE slug = ?').get(String(req.body?.property_slug ?? '')) as { id: string } | undefined
      if (!p) throw notFound('We couldn’t find that place.')
      const evidence = String(req.body?.evidence_type ?? '')
      if (!['rent_receipt', 'rental_agreement', 'payment_record', 'id_card'].includes(evidence)) throw badRequest('INVALID_EVIDENCE', 'Choose a rent receipt, rental agreement, payment record or ID card.')
      const now = nowIso()
      db()
        .prepare(
          `INSERT INTO residency_verifications (id, user_id, property_id, evidence_type, status, created_at, updated_at, data_source)
           VALUES (?, ?, ?, ?, 'pending', ?, ?, 'user_submitted') ON CONFLICT(user_id, property_id) DO NOTHING`,
        )
        .run(`res_${crypto.randomUUID().slice(0, 12)}`, req.user!.id, p.id, evidence, now, now)
      return { status: 'pending', message: 'Thanks. A moderator will check your evidence. In the demo, no file is uploaded or stored.' }
    }, 201),
  )

  r.get('/compare', route((req) => compareProperties(db(), String(req.query.ids ?? ''))))

  r.post('/search/interpret', route((req) => interpretQuery(db(), String(req.body?.query ?? ''))))

  // Live, unverified web links for the same search. Kept separate from /properties on purpose.
  r.get(
    '/search/web',
    route((req) => {
      checkWebRateLimit(req.ip ?? 'unknown')
      const area = db().prepare('SELECT slug, name, district, state, status FROM areas WHERE slug = ?').get(config.activeArea) as AreaInfo | undefined
      if (!area) throw notFound(`The configured area “${config.activeArea}” has no data. Run npm run seed.`)
      return searchWeb(req.query.q, area)
    }),
  )

  r.post('/properties/:slug/estimate', route((req) => computeEstimate(db(), req.params.slug, validateEstimateInput(req.body))))

  r.post(
    '/bookings',
    requireUser,
    route((req, res) => {
      const { booking, replayed } = createBooking(db(), req.user!.id, req.body ?? {}, (req.headers['idempotency-key'] as string) ?? req.body?.idempotency_key)
      res.status(replayed ? 200 : 201)
      return { booking, replayed }
    }),
  )
  r.get('/bookings', requireUser, route((req) => ({ results: listBookings(db(), { userId: req.user!.id }) })))
  r.get('/bookings/:reference', requireUser, route((req) => getBooking(db(), req.params.reference, req.user!.id)))
  r.post('/bookings/:reference/cancel', requireUser, route((req) => cancelBooking(db(), req.user!.id, req.params.reference)))
  r.post('/properties/:slug/waitlist', requireUser, route((req) => joinWaitlist(db(), req.user!.id, req.params.slug, String(req.body?.room_type ?? '')), 201))

  r.post(
    '/waitlist',
    route((req) => {
      const email = String(req.body?.email ?? '').trim().toLowerCase()
      const area = String(req.body?.area_slug ?? '')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('INVALID_EMAIL', 'Enter a valid email address.')
      if (!db().prepare(`SELECT 1 FROM areas WHERE slug = ? AND status = 'coming_soon'`).get(area)) throw badRequest('INVALID_AREA', 'Choose one of the coming-soon areas.')
      const now = nowIso()
      db()
        .prepare(`INSERT OR IGNORE INTO area_waitlist (id, email, area_slug, created_at, updated_at, data_source) VALUES (?, ?, ?, ?, ?, 'user_submitted')`)
        .run(`aw_${crypto.randomUUID().slice(0, 12)}`, email, area, now, now)
      return { joined: true, message: 'You’re on the list. We’ll email you when this area opens.' }
    }, 201),
  )

  r.get(
    '/saved',
    requireUser,
    route((req) => {
      const rows = db()
        .prepare(
          `SELECT ps.* FROM saved_properties sp JOIN property_search ps ON ps.id = sp.property_id
           WHERE sp.user_id = ? AND ps.area_slug = ? ORDER BY sp.created_at DESC`,
        )
        .all(req.user!.id, config.activeArea) as Record<string, any>[]
      return { results: rows.map((row) => toSummary(db(), row)) }
    }),
  )
  r.put(
    '/saved',
    requireUser,
    route((req) => {
      const d = db()
      const now = nowIso()
      const idFor = (slug: string) => (d.prepare('SELECT id FROM properties WHERE slug = ?').get(slug) as { id: string } | undefined)?.id
      const body = req.body ?? {}
      if (Array.isArray(body.slugs)) {
        const ids = (body.slugs as string[]).map(idFor).filter(Boolean) as string[]
        d.transaction(() => {
          d.prepare('DELETE FROM saved_properties WHERE user_id = ?').run(req.user!.id)
          for (const id of ids)
            d.prepare(`INSERT INTO saved_properties (user_id, property_id, created_at, updated_at, data_source) VALUES (?, ?, ?, ?, 'user_submitted')`).run(req.user!.id, id, now, now)
        })()
      } else {
        const id = idFor(String(body.slug ?? ''))
        if (!id) throw notFound('We couldn’t find that place.')
        if (body.saved === false) d.prepare('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?').run(req.user!.id, id)
        else d.prepare(`INSERT OR IGNORE INTO saved_properties (user_id, property_id, created_at, updated_at, data_source) VALUES (?, ?, ?, ?, 'user_submitted')`).run(req.user!.id, id, now, now)
      }
      const slugs = (d.prepare('SELECT p.slug FROM saved_properties sp JOIN properties p ON p.id = sp.property_id WHERE sp.user_id = ?').all(req.user!.id) as { slug: string }[]).map((x) => x.slug)
      return { slugs }
    }),
  )

  // ---------- push notifications ----------
  r.get('/push/key', route(() => ({ public_key: vapidKeys().publicKey })))
  r.post('/push/subscription', requireUser, route((req) => saveSubscription(db(), req.user!.id, req.body), 201))
  r.delete('/push/subscription', requireUser, route((req) => removeSubscription(db(), req.user!.id, req.body?.endpoint)))
  r.post(
    '/push/test',
    requireUser,
    route(async (req) => {
      checkPushTestLimit(req.user!.id)
      const sent = await notifyUser(db(), req.user!.id, {
        title: 'Notifications are on',
        body: 'Havenly will tell you when a booking request is answered or a waitlisted bed opens up.',
        url: '/requests',
        tag: 'havenly-test',
      })
      if (!sent) throw notFound('No active notification subscription on this account. Turn notifications on first.')
      return { sent }
    }),
  )

  r.post('/auth/demo-login', route((req) => demoLogin(req.body?.display_name)))
  r.get('/auth/me', requireUser, route((req) => ({ user: req.user })))

  return r
}
