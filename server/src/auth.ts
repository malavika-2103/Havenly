// Demo auth: an HMAC-signed token identifying a user. Good enough for a pitch; swap for real auth later.
import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { config } from './config'
import { getDb, nowIso } from './db'
import { HttpError } from './lib/http'
import type { DemoUser } from '../../shared/types'

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url')
const sign = (payload: string) => crypto.createHmac('sha256', config.tokenSecret).update(payload).digest('base64url')

export function issueToken(userId: string) {
  const payload = b64(JSON.stringify({ uid: userId, iat: Date.now() }))
  return `${payload}.${sign(payload)}`
}

export function verifyToken(token: string): string | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).uid ?? null
  } catch {
    return null
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: DemoUser
    }
  }
}

function bearer(req: Request) {
  const h = req.headers.authorization ?? ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

/** Attach req.user when a valid token is present. Never fails. */
export function optionalUser(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req)
  const uid = token ? verifyToken(token) : null
  if (uid) {
    const u = getDb().prepare('SELECT id, display_name, email FROM users WHERE id = ?').get(uid) as DemoUser | undefined
    if (u) req.user = u
  }
  next()
}

export function requireUser(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'SIGN_IN_REQUIRED', 'Sign in to do this. In the demo, use “Continue as demo user”.'))
  next()
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const token = (req.headers['x-admin-token'] as string | undefined) ?? bearer(req)
  const ok = token && token.length === config.adminToken.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(config.adminToken))
  if (!ok) return next(new HttpError(401, 'ADMIN_ONLY', 'Admin token required.'))
  next()
}

export function demoLogin(displayName?: string) {
  const db = getDb()
  const name = String(displayName ?? '').trim().slice(0, 40) || 'Demo guest'
  const id = `usr_${crypto.randomUUID().slice(0, 12)}`
  const now = nowIso()
  db.prepare(`INSERT INTO users (id, display_name, email, phone, created_at, updated_at, data_source) VALUES (?, ?, ?, NULL, ?, ?, 'user_submitted')`).run(
    id,
    name,
    `${id}@demo.havenly.example`,
    now,
    now,
  )
  const user: DemoUser = { id, display_name: name, email: `${id}@demo.havenly.example` }
  return { token: issueToken(id), user }
}
