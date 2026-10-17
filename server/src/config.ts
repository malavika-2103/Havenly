import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const SERVER_ROOT = path.resolve(here, '..')

const bool = (v: string | undefined, fallback: boolean) => (v === undefined ? fallback : v === 'true' || v === '1')

export const config = {
  port: Number(process.env.PORT ?? 8787),
  /** Local only by default. Set HOST=0.0.0.0 when deploying behind a proxy (and change ADMIN_TOKEN). */
  host: process.env.HOST ?? '127.0.0.1',
  /** The single launch area. Everything area-specific is read from the database using this slug. */
  activeArea: process.env.ACTIVE_AREA ?? 'kakkanad',
  adminToken: process.env.ADMIN_TOKEN ?? 'havenly-admin-demo',
  tokenSecret: process.env.TOKEN_SECRET ?? 'havenly-demo-secret-change-me',
  dbPath: path.resolve(SERVER_ROOT, process.env.DB_PATH ?? 'data/havenly.db'),
  demoMode: bool(process.env.DEMO_MODE, true),
  bookingExpiryHours: Number(process.env.BOOKING_EXPIRY_HOURS ?? 72),
  maxMoveInDays: 90,
  maxCompare: 3,
  /** Live web results on the search page. Empty = feature off (endpoint answers 503, UI hides the section). */
  tavilyApiKey: (process.env.TAVILY_API_KEY ?? '').trim(),
}
