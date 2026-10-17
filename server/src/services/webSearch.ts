// Live web results from Tavily, shown beside (never mixed into) Havenly's own listings.
// Nothing returned here is checked by Havenly, so every response is labelled unverified.
import { config } from '../config'
import { badRequest, HttpError } from '../lib/http'
import type { AreaInfo, WebResult, WebResultsResponse } from '../../../shared/types'

const TAVILY_URL = 'https://api.tavily.com/search'
const MAX_RESULTS = 6
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 200
const MAX_TEXT = 300
const CACHE_TTL_MS = 10 * 60_000
const CACHE_MAX = 200

export const WEB_NOTICE =
  'These links come from a live web search. Havenly has not checked them: prices, rules and availability may be wrong or out of date. Never pay a deposit before visiting.'

/** Replaced in tests so no real network call is made. */
let fetchImpl: typeof fetch = (...args) => fetch(...args)
export const setWebFetchForTests = (f: typeof fetch) => {
  fetchImpl = f
  cache.clear()
}

const cache = new Map<string, { at: number; value: WebResultsResponse }>()

const clip = (s: unknown) => {
  const text = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text
}

/** Keep only well-formed http(s) links; a provider result can never inject a javascript: or data: URL into the page. */
function toResult(raw: any): WebResult | null {
  let url: URL
  try {
    url = new URL(String(raw?.url ?? ''))
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const title = clip(raw?.title) || url.hostname
  return { title, url: url.toString(), domain: url.hostname.replace(/^www\./, ''), snippet: clip(raw?.content) }
}

export function cleanWebQuery(input: unknown): string {
  const q = String(input ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (q.length < 2) throw badRequest('QUERY_REQUIRED', 'Type what you are looking for first.')
  if (q.length > MAX_QUERY_LENGTH) throw badRequest('QUERY_TOO_LONG', `Keep the search under ${MAX_QUERY_LENGTH} characters.`)
  return q
}

export async function searchWeb(input: unknown, area: AreaInfo): Promise<WebResultsResponse> {
  const userQuery = cleanWebQuery(input)
  if (!config.tavilyApiKey) {
    throw new HttpError(503, 'WEB_SEARCH_DISABLED', 'Live web results are turned off. Add TAVILY_API_KEY to .env to turn them on.')
  }

  // Keep the web search about accommodation in the launch area, whatever the user typed.
  const query = `${userQuery} PG hostel accommodation in ${area.name}, ${area.district}, ${area.state}`
  const key = query.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value

  let res: Response
  try {
    res = await fetchImpl(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.tavilyApiKey}` },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: MAX_RESULTS,
        include_answer: false,
        include_images: false,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(502, 'WEB_SEARCH_FAILED', 'Live web results could not be loaded right now.')
  }
  if (!res.ok) {
    // Never forward the provider's body: it can echo request details. Log the status for the operator only.
    console.warn(`Tavily search failed with HTTP ${res.status}`)
    const code = res.status === 401 || res.status === 403 ? 'WEB_SEARCH_KEY_INVALID' : 'WEB_SEARCH_FAILED'
    const message =
      code === 'WEB_SEARCH_KEY_INVALID' ? 'The Tavily API key was rejected. Check TAVILY_API_KEY in .env.' : 'Live web results could not be loaded right now.'
    throw new HttpError(502, code, message)
  }

  const data = (await res.json().catch(() => null)) as { results?: unknown[] } | null
  const seen = new Set<string>()
  const results = (Array.isArray(data?.results) ? data!.results : [])
    .map(toResult)
    .filter((r): r is WebResult => !!r && !seen.has(r.url) && !!seen.add(r.url))
    .slice(0, MAX_RESULTS)

  const value: WebResultsResponse = { query, results, source: 'tavily', unverified: true, notice: WEB_NOTICE, fetched_at: new Date().toISOString() }
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
  cache.set(key, { at: Date.now(), value })
  return value
}

// ---------- per-client rate limit (each call spends Tavily credits) ----------

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20
const hits = new Map<string, number[]>()

export function checkWebRateLimit(clientKey: string) {
  const now = Date.now()
  const recent = (hits.get(clientKey) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(clientKey, recent)
    throw new HttpError(429, 'TOO_MANY_WEB_SEARCHES', 'Too many web searches in a minute. Wait a moment and try again.')
  }
  recent.push(now)
  hits.set(clientKey, recent)
  if (hits.size > 5000) hits.clear()
}
export const resetWebRateLimitForTests = () => hits.clear()
