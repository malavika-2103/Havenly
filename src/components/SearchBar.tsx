import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkle, X, MapPin } from './Icons'
import { parseQuery, ParsedIntent } from '../lib/search'

export const intentToParams = (intent: ParsedIntent, raw: string): string => {
  const params = new URLSearchParams()
  if (raw.trim()) params.set('q', raw.trim())
  if (intent.locality) params.set('locality', intent.locality)
  if (intent.city) params.set('city', intent.city)
  if (intent.type) params.set('type', intent.type)
  if (intent.maxBudget) params.set('max', String(intent.maxBudget))
  if (intent.withFood === true) params.set('food', 'yes')
  if (intent.withFood === false) params.set('food', 'no')
  if (intent.ac) params.set('ac', 'yes')
  if (intent.curfew === 'none') params.set('curfew', 'No curfew')
  if (intent.room) params.set('room', intent.room)
  return params.toString()
}

const HINTS = [
  "Women's PG near Infopark under 9000 with food",
  'Hostel in Kakkanad with flexible late entry and Wi-Fi',
  'Shared rental near SmartCity with attached bathroom',
  "Working women's hostel in Thrikkakara with 24x7 guard",
]

export default function SearchBar({ compact = false, initial = '' }: { compact?: boolean; initial?: string }) {
  const [text, setText] = useState(initial)
  const [intent, setIntent] = useState<ParsedIntent>(() => parseQuery(initial))
  const navigate = useNavigate()

  const update = (value: string) => {
    setText(value)
    setIntent(parseQuery(value))
  }

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!text.trim()) return
    navigate(`/results?${intentToParams(intent, text)}`)
  }

  return (
    <div style={{ width: '100%' }}>
      <form className="searchbox" onSubmit={submit}>
        <span className="search-icon">
          <Sparkle size={22} />
        </span>
        <input
          value={text}
          onChange={(e) => update(e.target.value)}
          placeholder="Describe your ideal stay — “women's PG near Infopark under 9k with food and late entry”"
          aria-label="Describe the stay you are looking for"
        />
        {text && (
          <button type="button" className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => update('')} aria-label="Clear">
            <X size={16} />
          </button>
        )}
        <button type="submit" className="btn btn-primary" style={compact ? { padding: '10px 20px' } : undefined}>
          <Search size={18} /> Search
        </button>
      </form>

      {!compact && (
        <p className="coverage-note">
          <MapPin size={14} /> Currently covering Kakkanad, Ernakulam. More areas coming soon.
        </p>
      )}

      {!compact && intent.chips.length > 0 && (
        <div className="parsed-chips">
          <span className="hint-label">I heard:</span>
          {intent.chips.map((c, i) => (
            <span key={i} className="chip">
              {c.label}
            </span>
          ))}
        </div>
      )}

      {!compact && intent.chips.length === 0 && (
        <div className="search-hints">
          <span className="hint-label">Try:</span>
          {HINTS.map((h) => (
            <button key={h} type="button" className="hint-chip" onClick={() => update(h)}>
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
