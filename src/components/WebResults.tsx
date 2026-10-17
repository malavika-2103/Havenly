import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { AlertTriangle } from './Icons'
import type { WebResultsResponse } from '../../shared/types'

/**
 * Live links from a web search, shown in their own section below Havenly's listings.
 * Nothing here is checked by Havenly, so the section is always labelled unverified
 * and the results are never merged into, ranked with, or styled like real listings.
 */
export default function WebResults({ query }: { query: string }) {
  const [state, setState] = useState<{ data: WebResultsResponse | null; error: ApiError | null; loading: boolean }>({
    data: null,
    error: null,
    loading: false,
  })

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return setState({ data: null, error: null, loading: false })
    const ctrl = new AbortController()
    setState({ data: null, error: null, loading: true })
    api
      .webResults(q, ctrl.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => !ctrl.signal.aborted && setState({ data: null, error: error as ApiError, loading: false }))
    return () => ctrl.abort()
  }, [query])

  if (!query.trim()) return null
  const { data, error, loading } = state

  return (
    <section className="web-results" aria-labelledby="web-results-title">
      <div className="web-results-head">
        <h2 id="web-results-title">From the web</h2>
        <span className="badge badge-unverified">Unverified</span>
      </div>
      <p className="web-results-notice">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          {data?.notice ??
            'Live web search results. Havenly has not checked these: prices, rules and availability may be wrong or out of date. Never pay a deposit before visiting.'}
        </span>
      </p>

      {loading && (
        <div className="state-box web-results-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>Searching the web…</span>
        </div>
      )}

      {error && (
        <p className="tiny muted web-results-state">
          {error.code === 'WEB_SEARCH_DISABLED' ? 'Live web results are turned off on this server.' : error.message}
        </p>
      )}

      {data && data.results.length === 0 && <p className="tiny muted web-results-state">No web pages matched this search.</p>}

      {data && data.results.length > 0 && (
        <ul className="web-results-list">
          {data.results.map((r) => (
            <li key={r.url} className="web-result">
              <a href={r.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="web-result-title">
                {r.title}
              </a>
              <span className="web-result-domain">{r.domain}</span>
              {r.snippet && <p className="web-result-snippet">{r.snippet}</p>}
            </li>
          ))}
        </ul>
      )}

      {data && data.results.length > 0 && <p className="tiny muted">Web results by Tavily. Links open the original site in a new tab.</p>}
    </section>
  )
}
