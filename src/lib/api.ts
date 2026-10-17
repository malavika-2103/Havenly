// Typed client for the Havenly API. Every price, filter and label the UI shows comes through here.
import type {
  BookingRequest,
  CompareResponse,
  Estimate,
  EstimateInput,
  FiltersResponse,
  InterpretResult,
  LoginResponse,
  Meta,
  NewReviewInput,
  PropertyDetail,
  PropertyListResponse,
  PropertySummary,
  ReviewListResponse,
  WebResultsResponse,
} from '../../shared/types'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message)
  }
}

const TOKEN_KEY = 'havenly:token'
const ADMIN_KEY = 'havenly:admin-token'

const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value == null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    } catch {
      /* private mode: the session just won't persist */
    }
  },
}

export const session = {
  token: () => storage.get(TOKEN_KEY),
  setToken: (t: string | null) => storage.set(TOKEN_KEY, t),
  adminToken: () => storage.get(ADMIN_KEY),
  setAdminToken: (t: string | null) => storage.set(ADMIN_KEY, t),
}

async function request<T>(path: string, init: RequestInit & { admin?: boolean } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = init.admin ? session.adminToken() : session.token()
  if (token) headers.set(init.admin ? 'X-Admin-Token' : 'Authorization', init.admin ? token : `Bearer ${token}`)
  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Can’t reach the Havenly server. Check that `npm run dev` is running.')
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const e = data?.error ?? {}
    throw new ApiError(res.status, e.code ?? 'ERROR', e.message ?? `Request failed (${res.status})`, e.details)
  }
  return data as T
}

const post = <T>(path: string, body: unknown, extra: RequestInit & { admin?: boolean } = {}) =>
  request<T>(path, { ...extra, method: 'POST', body: JSON.stringify(body ?? {}) })

export const toQuery = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && v !== '' && q.set(k, v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  meta: () => request<Meta>('/meta'),
  filters: () => request<FiltersResponse>('/filters'),
  properties: (params: Record<string, string | undefined>) => request<PropertyListResponse>(`/properties${toQuery(params)}`),
  property: (slug: string) => request<PropertyDetail>(`/properties/${encodeURIComponent(slug)}`),
  propertyReviews: (slug: string, sort = 'helpful') => request<ReviewListResponse>(`/properties/${encodeURIComponent(slug)}/reviews?sort=${sort}`),
  reviews: (params: { sort?: string; limit?: number; type?: string } = {}) =>
    request<ReviewListResponse>(`/reviews${toQuery({ sort: params.sort, limit: params.limit ? String(params.limit) : undefined, type: params.type })}`),
  createReview: (input: NewReviewInput) => post<{ id: string; message: string; verified_resident: boolean }>('/reviews', input),
  helpful: (id: string) => post<{ helpful_count: number }>(`/reviews/${id}/helpful`, {}),
  report: (id: string, reason: string) => post<{ message: string }>(`/reviews/${id}/report`, { reason }),
  compare: (slugs: string[]) => request<CompareResponse>(`/compare?ids=${slugs.map(encodeURIComponent).join(',')}`),
  interpret: (query: string, signal?: AbortSignal) => post<InterpretResult>('/search/interpret', { query }, { signal }),
  pushKey: () => request<{ public_key: string }>('/push/key'),
  pushSubscribe: (subscription: PushSubscriptionJSON) => post<{ subscribed: boolean }>('/push/subscription', subscription),
  pushUnsubscribe: (endpoint: string) => request<{ subscribed: boolean }>('/push/subscription', { method: 'DELETE', body: JSON.stringify({ endpoint }) }),
  pushTest: () => post<{ sent: number }>('/push/test', {}),
  webResults: (q: string, signal?: AbortSignal) => request<WebResultsResponse>(`/search/web${toQuery({ q })}`, { signal }),
  estimate: (slug: string, input: EstimateInput, signal?: AbortSignal) => post<Estimate>(`/properties/${encodeURIComponent(slug)}/estimate`, input, { signal }),
  createBooking: (body: EstimateInput & { property_slug: string; note?: string }, idempotencyKey: string) =>
    post<{ booking: BookingRequest; replayed: boolean }>('/bookings', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
  bookings: () => request<{ results: BookingRequest[] }>('/bookings'),
  cancelBooking: (ref: string) => post<BookingRequest>(`/bookings/${ref}/cancel`, {}),
  joinWaitlist: (slug: string, room_type: string) => post<{ message: string; position: number }>(`/properties/${encodeURIComponent(slug)}/waitlist`, { room_type }),
  areaWaitlist: (email: string, area_slug: string) => post<{ message: string }>('/waitlist', { email, area_slug }),
  saved: () => request<{ results: PropertySummary[] }>('/saved'),
  setSaved: (slug: string, saved: boolean) => request<{ slugs: string[] }>('/saved', { method: 'PUT', body: JSON.stringify({ slug, saved }) }),
  demoLogin: (display_name?: string) => post<LoginResponse>('/auth/demo-login', { display_name }),
  me: () => request<{ user: LoginResponse['user'] }>('/auth/me'),

  admin: {
    get: <T = any>(path: string) => request<T>(`/admin${path}`, { admin: true }),
    post: <T = any>(path: string, body: unknown) => post<T>(`/admin${path}`, body, { admin: true }),
    patch: <T = any>(path: string, body: unknown) => request<T>(`/admin${path}`, { method: 'PATCH', body: JSON.stringify(body), admin: true }),
  },
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', opts) : '—'

export const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
