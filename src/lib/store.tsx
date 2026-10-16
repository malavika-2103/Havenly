import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef, DependencyList } from 'react'
import { api, ApiError, session } from './api'
import type { DemoUser, FiltersResponse, Meta } from '../../shared/types'

export interface Toast {
  id: number
  message: string
}

interface StoreValue {
  user: DemoUser | null
  meta: Meta | null
  filters: FiltersResponse | null
  /** Display label for a filter option value, straight from /api/filters. */
  optionLabel: (key: string, value: string) => string
  saved: string[]
  compare: string[]
  toggleSave: (slug: string, name: string) => void
  toggleCompare: (slug: string, name: string) => void
  clearCompare: () => void
  resetUser: () => Promise<void>
  toasts: Toast[]
  toast: (message: string) => void
  bootError: string | null
}

const StoreContext = createContext<StoreValue | null>(null)
const COMPARE_KEY = 'havenly:compare'
const MAX_COMPARE = 3

const loadCompare = (): string[] => {
  try {
    const raw = localStorage.getItem(COMPARE_KEY)
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}

async function ensureUser(): Promise<DemoUser> {
  if (session.token()) {
    try {
      return (await api.me()).user
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e
    }
  }
  const { token, user } = await api.demoLogin('Demo guest')
  session.setToken(token)
  return user
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [filters, setFilters] = useState<FiltersResponse | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [compare, setCompare] = useState<string[]>(loadCompare)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [bootError, setBootError] = useState<string | null>(null)

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  useEffect(() => {
    Promise.all([api.meta(), api.filters()])
      .then(([m, f]) => {
        setMeta(m)
        setFilters(f)
      })
      .catch((e) => setBootError(e.message))
    ensureUser()
      .then(async (u) => {
        setUser(u)
        const s = await api.saved()
        setSaved(s.results.map((p) => p.slug))
      })
      .catch((e) => setBootError(e.message))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(compare))
    } catch {
      /* ignore */
    }
  }, [compare])

  const labelIndex = useMemo(() => {
    const idx = new Map<string, string>()
    filters?.filters.forEach((f) => f.options?.forEach((o) => idx.set(`${f.key}:${o.value}`, o.label)))
    return idx
  }, [filters])
  const optionLabel = useCallback((key: string, value: string) => labelIndex.get(`${key}:${value}`) ?? value, [labelIndex])

  const toggleSave = useCallback(
    (slug: string, name: string) => {
      const next = !saved.includes(slug)
      setSaved((prev) => (next ? [...prev, slug] : prev.filter((s) => s !== slug)))
      api
        .setSaved(slug, next)
        .then((r) => {
          setSaved(r.slugs)
          toast(next ? `Saved “${name}”` : `Removed “${name}” from Saved`)
        })
        .catch((e) => {
          setSaved((prev) => (next ? prev.filter((s) => s !== slug) : [...prev, slug]))
          toast(e.message)
        })
    },
    [saved, toast],
  )

  const toggleCompare = useCallback(
    (slug: string, name: string) => {
      if (compare.includes(slug)) {
        setCompare(compare.filter((x) => x !== slug))
        toast(`Removed “${name}” from Compare`)
      } else if (compare.length >= MAX_COMPARE) {
        toast(`You can compare up to ${MAX_COMPARE} places at a time`)
      } else {
        setCompare([...compare, slug])
        toast(`Added “${name}” to Compare`)
      }
    },
    [compare, toast],
  )

  const resetUser = useCallback(async () => {
    session.setToken(null)
    const u = await ensureUser()
    setUser(u)
    setSaved([])
    toast('Started a fresh demo session')
  }, [toast])

  return (
    <StoreContext.Provider
      value={{ user, meta, filters, optionLabel, saved, compare, toggleSave, toggleCompare, clearCompare: () => setCompare([]), resetUser, toasts, toast, bootError }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** Load data with loading and error state. Re-runs when deps change; stale responses are ignored. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<{ data: T | null; error: ApiError | Error | null; loading: boolean }>({ data: null, error: null, loading: true })
  const seq = useRef(0)
  const run = useCallback(() => {
    const n = ++seq.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => n === seq.current && setState({ data, error: null, loading: false }))
      .catch((error) => n === seq.current && setState({ data: null, error, loading: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(run, [run])
  return { ...state, reload: run }
}
