import { useState } from 'react'
import { api } from '../lib/api'
import { useAsync } from '../lib/store'
import ReviewCard from '../components/ReviewCard'
import { Loading, ErrorState, Empty } from '../components/States'

const TYPES = [
  ['', 'All'],
  ['tip', 'Tips'],
  ['expectation_vs_reality', 'Expectation vs reality'],
  ['hidden_cost', 'Hidden costs'],
  ['rule_experience', 'Rules in practice'],
  ['safety_report', 'Personal safety experiences'],
] as const

export default function Experiences() {
  const [type, setType] = useState('')
  const list = useAsync(() => api.reviews({ sort: 'helpful', limit: 30, type: type || undefined }), [type])

  return (
    <div className="container page-pad">
      <div className="section-head">
        <div>
          <span className="eyebrow">Experiences</span>
          <h1 className="display-lg">What living there is like</h1>
          <p>
            Reviews from residents. A “stay verified” label means the reviewer showed a rent receipt or agreement for that exact place. Evidence is never shown publicly.
          </p>
        </div>
      </div>
      <div className="pill-options" style={{ marginBottom: 20 }} role="tablist" aria-label="Review type">
        {TYPES.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={type === v} className={`pill-option${type === v ? ' on' : ''}`} onClick={() => setType(v)}>
            {l}
          </button>
        ))}
      </div>
      {list.loading && !list.data && <Loading />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {list.data?.total === 0 && <Empty title="No reviews of this type yet" />}
      <div className="exp-feed">
        {list.data?.results.map((r) => (
          <ReviewCard key={r.id} r={r} showProperty />
        ))}
      </div>
    </div>
  )
}
