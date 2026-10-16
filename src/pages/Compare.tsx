import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import Art from '../components/Art'
import SourceBadge from '../components/SourceBadge'
import { Loading, ErrorState, Empty } from '../components/States'
import { Info, Scales, ArrowRight } from '../components/Icons'

export default function Compare() {
  const { compare, toggleCompare, clearCompare, saved, toggleSave } = useStore()
  const [onlyDiff, setOnlyDiff] = useState(false)
  const data = useAsync(() => (compare.length ? api.compare(compare) : Promise.resolve(null)), [compare.join(',')])

  if (compare.length === 0)
    return (
      <div className="container page-pad">
        <h1 className="display-lg">Compare places</h1>
        <Empty title="Add places to compare" icon={<Scales size={30} style={{ color: 'var(--mauve)' }} />}>
          <p className="muted">Use “Compare” on any listing. You can compare up to three places side by side.</p>
          <Link to="/results" className="btn btn-primary" style={{ marginTop: 18 }}>
            Find places to compare <ArrowRight size={16} />
          </Link>
        </Empty>
      </div>
    )

  const c = data.data
  const rows = c ? c.rows.filter((r) => !onlyDiff || r.differs) : []
  let lastGroup = ''

  return (
    <div className="container page-pad">
      <div className="section-head">
        <div>
          <span className="eyebrow">Side by side</span>
          <h1 className="display-lg">Compare places</h1>
          <p>Comparing {compare.length} of 3. Rows that differ are highlighted. “Best” only marks clear numeric wins like lower rent.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="check-row" style={{ margin: 0 }}>
            <input id="only-diff" type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} /> Only show differences
          </label>
          <button className="btn btn-outline btn-sm" onClick={clearCompare}>
            Clear all
          </button>
          {compare.length < 3 && (
            <Link to="/results" className="btn btn-secondary btn-sm">
              Add a place
            </Link>
          )}
        </div>
      </div>

      {data.loading && !c && <Loading label="Lining them up…" />}
      {data.error && <ErrorState error={data.error} onRetry={data.reload} />}
      {c && (
        <div className="compare-wrap card">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="row-label" scope="col">
                  <span className="sr-only">Field</span>
                </th>
                {c.properties.map((p) => (
                  <th key={p.id} className="compare-card-head" scope="col">
                    <div className="art" style={{ height: 100 }}>
                      <Art variant={p.art} />
                    </div>
                    <Link to={`/property/${p.slug}`}>
                      <b className="compare-name">{p.name}</b>
                    </Link>
                    <div className="tiny muted">{p.sub_area.name}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      <button className="link-btn" onClick={() => toggleSave(p.slug, p.name)}>
                        {saved.includes(p.slug) ? 'Saved' : 'Save'}
                      </button>
                      <button className="link-btn" onClick={() => toggleCompare(p.slug, p.name)}>
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const header = row.group !== lastGroup
                lastGroup = row.group
                return [
                  header ? (
                    <tr key={`g-${row.group}`} className="compare-group">
                      <td colSpan={c.properties.length + 1}>{row.group}</td>
                    </tr>
                  ) : null,
                  <tr key={row.key} className={row.differs ? 'differs' : undefined}>
                    <th className="row-label" scope="row">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i}>
                        {v ?? '—'}
                        {row.best_index === i && <span className="compare-best">Best</span>}
                        {row.sources[i] && (
                          <div>
                            <SourceBadge source={row.sources[i]!} compact />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>,
                ]
              })}
            </tbody>
          </table>
        </div>
      )}
      {c && (
        <p className="cost-note" style={{ marginTop: 18 }}>
          <Info size={15} />
          <span>{c.note} Hover a source icon to see whether a value is listed by the owner or verified by Havenly.</span>
        </p>
      )}
    </div>
  )
}
