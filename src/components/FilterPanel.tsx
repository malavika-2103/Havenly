import { useEffect, useState } from 'react'
import type { FacetCounts, FilterDef, FiltersResponse, FilterValues } from '../../shared/types'
import { Sliders, Shield } from './Icons'

/** Filter panel generated entirely from GET /api/filters, with live facet counts. */
export default function FilterPanel({
  filters,
  values,
  facets,
  onChange,
  onClear,
  open,
}: {
  filters: FiltersResponse
  values: FilterValues
  facets: FacetCounts
  onChange: (next: FilterValues) => void
  onClear: () => void
  open: boolean
}) {
  const set = (patch: FilterValues) => {
    const next = { ...values, ...patch }
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] == null) && delete next[k])
    onChange(next)
  }

  return (
    <aside className={`filter-panel${open ? ' open' : ''}`} aria-label="Filters">
      <div className="filter-head">
        <h3>
          <Sliders size={18} /> Filters
        </h3>
        <button className="link-btn" onClick={onClear}>
          Clear all
        </button>
      </div>
      <div className="filter-body">
        {filters.groups.map((g) => {
          const defs = filters.filters.filter((f) => f.group === g.key)
          if (!defs.length) return null
          const sourceNote = defs.find((d) => d.source_note)?.source_note
          return (
            <details className="filter-group" key={g.key} open={g.key !== 'commute' && g.key !== 'cleaning'}>
              <summary>
                <h4>{g.label}</h4>
              </summary>
              {sourceNote && (
                <p className="filter-help">
                  <Shield size={12} /> {sourceNote}
                </p>
              )}
              <div className="filter-group-body">
                {defs.map((def) => (
                  <FilterControl key={def.key} def={def} values={values} counts={facets[def.key]} set={set} />
                ))}
              </div>
            </details>
          )
        })}
      </div>
    </aside>
  )
}

function FilterControl({ def, values, counts, set }: { def: FilterDef; values: FilterValues; counts?: Record<string, number>; set: (p: FilterValues) => void }) {
  if (!def.supported)
    return (
      <div className="filter-row unsupported" title={def.help}>
        <span>{def.label}</span>
        <span className="tiny muted">Not tracked yet</span>
      </div>
    )

  const count = (v: string) => (counts && counts[v] != null ? <span className="count">{counts[v]}</span> : null)

  switch (def.kind) {
    case 'multi': {
      const cur = (values[def.key] ?? '').split(',').filter(Boolean)
      return (
        <div className="filter-row">
          <span className="filter-label">{def.label}</span>
          <div className="pill-options">
            {def.options!.map((o) => {
              const on = cur.includes(o.value)
              const n = counts?.[o.value]
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  className={`pill-option${on ? ' on' : ''}${n === 0 && !on ? ' zero' : ''}`}
                  onClick={() => set({ [def.key]: (on ? cur.filter((x) => x !== o.value) : [...cur, o.value]).join(',') })}
                >
                  {o.label} {count(o.value)}
                </button>
              )
            })}
          </div>
        </div>
      )
    }
    case 'single':
      return (
        <div className="filter-row">
          <span className="filter-label">{def.label}</span>
          <div className="pill-options">
            {def.options!.map((o) => {
              const on = values[def.key] === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  className={`pill-option${on ? ' on' : ''}${counts?.[o.value] === 0 && !on ? ' zero' : ''}`}
                  onClick={() => set({ [def.key]: on ? '' : o.value })}
                >
                  {o.label} {count(o.value)}
                </button>
              )
            })}
          </div>
          {def.help && <p className="filter-help">{def.help}</p>}
        </div>
      )
    case 'boolean':
      return (
        <label className="check-row">
          <input id={`f-${def.key}`} type="checkbox" checked={values[def.key] === 'true'} onChange={(e) => set({ [def.key]: e.target.checked ? 'true' : '' })} />
          <span>{def.label}</span>
          {count('true')}
        </label>
      )
    case 'range':
      return <RangeControl def={def} values={values} set={set} />
    case 'commute':
      return (
        <div className="filter-row">
          <span className="filter-label">{def.label}</span>
          <select id="f-near" value={values[def.key] ?? ''} onChange={(e) => set({ [def.key]: e.target.value, max_minutes: values.max_minutes ?? '15', commute_mode: values.commute_mode ?? 'auto' })}>
            <option value="">Anywhere</option>
            {def.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {values[def.key] && (
            <div className="range-row">
              <select id="f-minutes" value={values.max_minutes ?? '15'} onChange={(e) => set({ max_minutes: e.target.value })}>
                {def.commute!.minutes.map((m) => (
                  <option key={m} value={m}>
                    within {m} min
                  </option>
                ))}
              </select>
              <select id="f-mode" value={values.commute_mode ?? 'auto'} onChange={(e) => set({ commute_mode: e.target.value })}>
                <option value="walk">walking</option>
                <option value="auto">by auto</option>
                <option value="bus">by bus</option>
              </select>
            </div>
          )}
          {def.help && <p className="filter-help">{def.help}</p>}
        </div>
      )
  }
}

function RangeControl({ def, values, set }: { def: FilterDef; values: FilterValues; set: (p: FilterValues) => void }) {
  const r = def.range!
  const [lo, setLo] = useState(values[r.min_key] ?? '')
  const [hi, setHi] = useState(values[r.max_key] ?? '')
  useEffect(() => {
    setLo(values[r.min_key] ?? '')
    setHi(values[r.max_key] ?? '')
  }, [values, r.min_key, r.max_key])
  const commit = () => set({ [r.min_key]: lo, [r.max_key]: hi })
  return (
    <div className="filter-row">
      <span className="filter-label">{def.label}</span>
      <div className="range-row">
        <input id="f-rent-min" type="number" inputMode="numeric" placeholder="Min ₹" value={lo} onChange={(e) => setLo(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
        <span className="muted">–</span>
        <input id="f-rent-max" type="number" inputMode="numeric" placeholder="Max ₹" value={hi} onChange={(e) => setHi(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} />
      </div>
      <div className="pill-options" style={{ marginTop: 10 }}>
        {r.presets.map((p) => {
          const on = (values[r.min_key] ?? '') === (p.min != null ? String(p.min) : '') && (values[r.max_key] ?? '') === (p.max != null ? String(p.max) : '')
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={on}
              className={`pill-option${on ? ' on' : ''}`}
              onClick={() => set(on ? { [r.min_key]: '', [r.max_key]: '' } : { [r.min_key]: p.min != null ? String(p.min) : '', [r.max_key]: p.max != null ? String(p.max) : '' })}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
