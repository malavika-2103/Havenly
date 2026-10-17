// Web Push: tell people when their booking request is answered or a waitlisted room frees up.
// Sending never blocks or fails the request that triggered it; a dead subscription is simply removed.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import webpush from 'web-push'
import type { DB } from '../db'
import { nowIso } from '../db'
import { config, SERVER_ROOT } from '../config'
import { badRequest, HttpError } from '../lib/http'

type Row = Record<string, any>

export interface PushPayload {
  title: string
  body: string
  /** Same-origin path opened when the notification is tapped. */
  url: string
  tag?: string
}

// ---------- VAPID keys ----------
// .env wins. Otherwise a key pair is generated once and kept in server/data/vapid.json (git-ignored),
// so subscriptions keep working across restarts in development.

let keys: { publicKey: string; privateKey: string } | null = null

export function vapidKeys() {
  if (keys) return keys
  if (config.vapidPublicKey && config.vapidPrivateKey) {
    keys = { publicKey: config.vapidPublicKey, privateKey: config.vapidPrivateKey }
  } else {
    const file = path.join(SERVER_ROOT, 'data', 'vapid.json')
    try {
      keys = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      keys = webpush.generateVAPIDKeys()
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify(keys, null, 2), { mode: 0o600 })
    }
  }
  return keys!
}

// ---------- subscriptions ----------

// Only real browser push services. The server POSTs to the endpoint, so an arbitrary URL would let
// anyone make the server send requests to internal addresses.
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/]

export function validateSubscription(body: any) {
  const endpoint = String(body?.endpoint ?? '')
  const p256dh = String(body?.keys?.p256dh ?? '')
  const auth = String(body?.keys?.auth ?? '')
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw badRequest('INVALID_SUBSCRIPTION', 'That push subscription is not valid.')
  }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((h) => h.test(url.hostname)) || endpoint.length > 1000) {
    throw badRequest('INVALID_SUBSCRIPTION', 'That push subscription is not from a supported browser push service.')
  }
  const b64url = /^[A-Za-z0-9_-]+=*$/
  if (!b64url.test(p256dh) || !b64url.test(auth) || p256dh.length > 200 || auth.length > 100) {
    throw badRequest('INVALID_SUBSCRIPTION', 'That push subscription is missing its keys.')
  }
  return { endpoint, p256dh, auth }
}

export function saveSubscription(db: DB, userId: string, body: unknown) {
  const s = validateSubscription(body)
  // An endpoint belongs to one browser; if another demo user signs in there, it moves to them.
  db.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
  ).run(`push_${crypto.randomUUID().slice(0, 12)}`, userId, s.endpoint, s.p256dh, s.auth, nowIso())
  return { subscribed: true }
}

export function removeSubscription(db: DB, userId: string, endpoint: unknown) {
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, String(endpoint ?? ''))
  return { subscribed: false }
}

// ---------- sending ----------

type Sender = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<unknown>

let sender: Sender = (sub, payload) => {
  const k = vapidKeys()
  return webpush.sendNotification(sub, payload, {
    TTL: 24 * 60 * 60,
    urgency: 'normal',
    vapidDetails: { subject: config.vapidSubject, publicKey: k.publicKey, privateKey: k.privateKey },
  })
}
/** Tests swap the sender so nothing leaves the machine. */
export const setPushSenderForTests = (s: Sender) => {
  sender = s
}

/** Send to every device the user subscribed. Returns how many deliveries the push services accepted. */
export async function notifyUser(db: DB, userId: string, payload: PushPayload): Promise<number> {
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId) as Row[]
  const body = JSON.stringify(payload)
  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sender({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body)
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode
        // 404/410: the browser unsubscribed or the subscription expired. Forget it.
        if (status === 404 || status === 410) db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id)
        else console.warn(`Push to ${new URL(s.endpoint).hostname} failed${status ? ` with HTTP ${status}` : ''}`)
      }
    }),
  )
  return sent
}

/** Fire and forget: used from request handlers, which must not wait on push services. */
export const notifyUserLater = (db: DB, userId: string, payload: PushPayload) => {
  notifyUser(db, userId, payload).catch((err) => console.warn('Push failed', err))
}

/** Tell everyone waiting for this room type that a bed is free. */
export function notifyWaitlist(db: DB, propertyId: string, roomType: string) {
  const p = db.prepare('SELECT slug, name FROM properties WHERE id = ?').get(propertyId) as Row | undefined
  if (!p) return
  const users = db.prepare('SELECT user_id FROM room_waitlist WHERE property_id = ? AND room_type = ?').all(propertyId, roomType) as Row[]
  for (const u of users) {
    notifyUserLater(db, u.user_id, {
      title: 'A bed just opened up',
      body: `${p.name} has a free ${roomType === 'dorm' ? 'dorm' : roomType} bed again. Send a request before it goes.`,
      url: `/property/${p.slug}`,
      tag: `waitlist-${p.slug}-${roomType}`,
    })
  }
}

/** Free beds for a room type, used to spot the moment a full room opens up. */
export const freeBeds = (db: DB, propertyId: string, roomType: string) =>
  ((db.prepare('SELECT available_beds FROM room_inventory WHERE property_id = ? AND room_type = ?').get(propertyId, roomType) as Row | undefined)?.available_beds ?? 0) as number

// "Send a test notification" is cheap to abuse, so allow a few per user per minute.
const testHits = new Map<string, number[]>()
export function checkPushTestLimit(userId: string) {
  const now = Date.now()
  const recent = (testHits.get(userId) ?? []).filter((t) => now - t < 60_000)
  if (recent.length >= 5) throw new HttpError(429, 'TOO_MANY_TEST_NOTIFICATIONS', 'That’s enough test notifications for now. Try again in a minute.')
  recent.push(now)
  testHits.set(userId, recent)
  if (testHits.size > 5000) testHits.clear()
}
