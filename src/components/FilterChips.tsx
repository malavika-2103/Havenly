import { useEffect, useRef, useState } from 'react'
import type { FilterDef, FilterValues } from '../../shared/types'
import { ChipModel, withoutFilter } from '../lib/filters'

/**
 * Editable, removable chips for applied filters. Clicking a chip opens a small editor built from the
 * filter's own definition (options, range or commute), so there's no hand-maintained list here.
 */
export default function FilterChips({
  chips,
  values,
  onChange,
  label,
}: {
  chips: ChipModel[]
  values: FilterValues
  onChange: (next: FilterValues, removedDef?: FilterDef) => void
  label?: string
}) {
  const [open, setOpen] = useState<string | null>(null)
  if (!chips.length) return null
  return (
    <div className="parsed-chips" role="list" aria-label={label ?? 'Applied filters'}>
      {label && <span className="hint-label">{label}</span>}
      {chips.map((c) => (
        <span key={c.key} className="chip-wrap" role="listitem">
          <span className={`chip editable${open === c.key ? ' on' : ''}`}>
            <button
              type="button"
              className="chip-label"
              disabled={c.def.kind === 'boolean'}
              onClick={() => setOpen(open === c.key ? null : c.key)}
              aria-expanded={open === c.key}
              title={c.def.kind === 'boolean' ? c.label : 'Edit'}
            >
              {c.label}
            </button>
            <button type="button" className="chip-x" aria-label={`Remove ${c.label}`} onClick={() => onChange(withoutFilter(values, c.def), c.def)}>
              ×
            </button>
          </span>
          {open === c.key && <ChipEditor def={c.def} values={values} onClose={() => setOpen(null)} onChange={onChange} />}
        </span>
      ))}
    </div>
  )
}

function ChipEditor({ def, values, onChange, onClose }: { def: FilterDef; values: FilterValues; onChange: (v: FilterValues) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    setTimeout(() => document.addEventListener('mousedown', onDoc))
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const set = (patch: FilterValues) => {
    const next = { ...values, ...patch }
    Object.keys(next).forEach((k) => next[k] === '' && delete next[k])
    onChange(next)
  }

  return (
    <div className="chip-pop" ref={ref} role="dialog" aria-label={`Edit ${def.label}`}>
      <b>{def.label}</b>
      {def.kind === 'multi' && (
        <div className="chip-pop-opts">
          {def.options!.map((o) => {
            const cur = (values[def.key] ?? '').split(',').filter(Boolean)
            const on = cur.includes(o.value)
            return (
              <label key={o.value} className="check-row">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => set({ [def.key]: (on ? cur.filter((x) => x !== o.value) : [...cur, o.value]).join(',') })}
                />
                {o.label}
              </label>
            )
          })}
        </div>
      )}
      {def.kind === 'single' && (
        <div className="chip-pop-opts">
          {def.options!.map((o) => (
            <label key={o.value} className="check-row">
              <input type="radio" name={`pop-${def.key}`} checked={values[def.key] === o.value} onChange={() => set({ [def.key]: o.value })} />
              {o.label}
            </label>
          ))}
        </div>
      )}
      {def.kind === 'range' && def.range && (
        <div className="range-row">
          <input
            id={`pop-${def.range.min_key}`}
            type="number"
            inputMode="numeric"
            placeholder="Min ₹"
            defaultValue={values[def.range.min_key] ?? ''}
            onBlur={(e) => set({ [def.range!.min_key]: e.target.value })}
          />
          <span className="muted">–</span>
          <input
            id={`pop-${def.range.max_key}`}
            type="number"
            inputMode="numeric"
            placeholder="Max ₹"
            defaultValue={values[def.range.max_key] ?? ''}
            onBlur={(e) => set({ [def.range!.max_key]: e.target.value })}
          />
        </div>
      )}
      {def.kind === 'commute' && def.commute && (
        <div className="chip-pop-opts">
          <select value={values[def.key] ?? ''} onChange={(e) => set({ [def.key]: e.target.value })}>
            {def.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={values[def.commute.minutes_key] ?? '15'} onChange={(e) => set({ [def.commute!.minutes_key]: e.target.value })}>
              {def.commute.minutes.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
            <select value={values[def.commute.mode_key] ?? 'auto'} onChange={(e) => set({ [def.commute!.mode_key]: e.target.value })}>
              <option value="walk">walking</option>
              <option value="auto">by auto</option>
              <option value="bus">by bus</option>
            </select>
          </div>
        </div>
      )}
      <button type="button" className="link-btn" onClick={onClose}>
        Done
      </button>
    </div>
  )
}
