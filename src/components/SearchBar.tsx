import { useState, FormEvent, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkle, X, MapPin } from './Icons'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { chipsFor, toSearch } from '../lib/filters'
import FilterChips from './FilterChips'
import InterpretNotes from './InterpretNotes'
import type { FilterValues, InterpretResult } from '../../shared/types'

export default function SearchBar({ compact = false, initial = '' }: { compact?: boolean; initial?: string }) {
  const { filters, meta } = useStore()
  const hints = meta?.example_searches ?? []
  const [text, setText] = useState(initial)
  const [result, setResult] = useState<InterpretResult | null>(null)
  const [values, setValues] = useState<FilterValues>({})
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const ctrl = useRef<AbortController | null>(null)

  useEffect(() => setText(initial), [initial])

  // Live "I heard" preview on the home page, debounced.
  useEffect(() => {
    if (compact) return
    if (text.trim().length < 3) {
      setResult(null)
      setValues({})
      return
    }
    const t = setTimeout(() => {
      ctrl.current?.abort()
      ctrl.current = new AbortController()
      api
        .interpret(text, ctrl.current.signal)
        .then((r) => {
          setResult(r)
          setValues(r.filters)
        })
        .catch(() => {})
    }, 350)
    return () => clearTimeout(t)
  }, [text, compact])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      // Use the previewed (and possibly edited) filters if they belong to this exact text.
      const fresh = result?.query === text ? null : await api.interpret(text)
      const finalValues = fresh ? fresh.filters : values
      navigate(`/results?${toSearch(finalValues, { say: text.trim() })}`)
    } catch {
      navigate(`/results?${toSearch({}, { say: text.trim() })}`)
    } finally {
      setBusy(false)
    }
  }

  const chips = chipsFor(values, filters)

  return (
    <div style={{ width: '100%' }}>
      <form className="searchbox" onSubmit={submit} role="search">
        <span className="search-icon">
          <Sparkle size={22} />
        </span>
        <input
          id={compact ? 'search-compact' : 'search-home'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your ideal stay, e.g. “women’s PG near Infopark under 9k with food and late entry”"
          aria-label="Describe the stay you are looking for"
        />
        {text && (
          <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setText('')} aria-label="Clear search">
            <X size={16} />
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy} style={compact ? { padding: '10px 20px' } : undefined}>
          <Search size={18} /> {busy ? 'Reading…' : 'Search'}
        </button>
      </form>

      {!compact && meta && (
        <p className="coverage-note">
          <MapPin size={14} /> Currently covering {meta.active_area.name}, {meta.active_area.district}. More areas coming soon.
        </p>
      )}

      {!compact && result && (
        <>
          {chips.length > 0 && <FilterChips label="I heard:" chips={chips} values={values} onChange={setValues} />}
          <InterpretNotes result={result} />
        </>
      )}

      {!compact && !result && hints.length > 0 && (
        <div className="search-hints">
          <span className="hint-label">Try:</span>
          {hints.map((h) => (
            <button key={h} type="button" className="hint-chip" onClick={() => setText(h)}>
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
