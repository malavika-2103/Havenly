import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import FilterPanel from '../components/FilterPanel'
import FilterChips from '../components/FilterChips'
import InterpretNotes, { OutOfCoverage } from '../components/InterpretNotes'
import { Loading, ErrorState, Empty } from '../components/States'
import { api } from '../lib/api'
import { useAsync, useStore } from '../lib/store'
import { chipsFor, toSearch, valuesFromParams } from '../lib/filters'
import { Sliders, X } from '../components/Icons'
import type { FilterValues, InterpretResult } from '../../shared/types'

export default function Results() {
  const [params, setParams] = useSearchParams()
  const { filters, meta } = useStore()
  const [showFilters, setShowFilters] = useState(false)
  const say = params.get('say') ?? ''
  const sort = params.get('sort') ?? 'relevance'
  const values = useMemo(() => valuesFromParams(params), [params])
  const key = toSearch(values, { sort })

  // The sentence is re-read only for what filters can't hold: unsupported requests, the question, coverage.
  const [heard, setHeard] = useState<InterpretResult | null>(null)
  useEffect(() => {
    if (!say) return setHeard(null)
    let live = true
    api.interpret(say).then((r) => live && setHeard(r)).catch(() => live && setHeard(null))
    return () => {
      live = false
    }
  }, [say])

  const outOfCoverage = heard?.out_of_coverage ?? null
  const list = useAsync(() => (outOfCoverage ? Promise.resolve(null) : api.properties({ ...values, sort, limit: '50' })), [key, !!outOfCoverage])

  const update = (next: FilterValues, extra: Record<string, string | undefined> = {}) =>
    setParams(toSearch(next, { say: say || undefined, sort: sort !== 'relevance' ? sort : undefined, ...extra }), { replace: true })
  const clearAll = () => setParams(say ? { say } : {}, { replace: true })

  const chips = chipsFor(values, filters)
  const data = list.data

  return (
    <>
      <div className="results-hero">
        <div className="container">
          <div className="results-search">
            <SearchBar compact initial={say} />
            <button className="btn btn-secondary filter-fab" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <Sliders size={17} /> Filters {chips.length > 0 && `(${chips.length})`}
            </button>
          </div>
          {chips.length > 0 && <FilterChips label={say ? 'I heard:' : 'Filters:'} chips={chips} values={values} onChange={(v) => update(v)} />}
          <InterpretNotes result={heard} showCoverage={false} />
        </div>
      </div>

      <div className="container results-layout">
        {filters ? (
          <FilterPanel filters={filters} values={values} facets={data?.facets ?? {}} onChange={(v) => update(v)} onClear={clearAll} open={showFilters} />
        ) : (
          <aside className="filter-panel">
            <Loading label="Loading filters…" />
          </aside>
        )}

        <section aria-live="polite">
          {outOfCoverage ? (
            <OutOfCoverage info={outOfCoverage} />
          ) : (
            <>
              <div className="results-toolbar">
                <span className="results-count">
                  {data ? (
                    <>
                      <b>{data.total}</b> {data.total === 1 ? 'place' : 'places'} in {meta?.active_area.name ?? 'the area'}
                    </>
                  ) : (
                    'Searching…'
                  )}
                </span>
                <label className="sr-only" htmlFor="sort">
                  Sort
                </label>
                <select id="sort" className="sort-select" value={sort} onChange={(e) => update(values, { sort: e.target.value === 'relevance' ? undefined : e.target.value })}>
                  {(filters?.sorts ?? [{ value: 'relevance', label: 'Recommended' }]).map((s) => (
                    <option key={s.value} value={s.value}>
                      Sort: {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {list.loading && !data && <Loading label="Finding places…" />}
              {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
              {data && data.total === 0 && (
                <Empty title="No places match all of that yet">
                  <p className="muted">Try widening your budget or removing a filter or two.</p>
                  <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={clearAll}>
                    <X size={16} /> Clear all filters
                  </button>
                </Empty>
              )}
              {data?.results.map((p) => <PropertyCard key={p.id} p={p} />)}
              {data && data.total > 0 && (
                <p className="tiny muted results-foot">Availability and prices are as last updated by each listing. Havenly never takes payment.</p>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
