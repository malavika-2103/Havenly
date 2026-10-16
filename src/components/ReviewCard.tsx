import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Review } from '../../shared/types'
import { api, formatDate } from '../lib/api'
import { useStore } from '../lib/store'
import { Shield, StarFill, ThumbsUp, AlertTriangle, Info } from './Icons'

const TYPE_LABEL: Record<Review['review_type'], string> = {
  general: 'Review',
  tip: 'Tip',
  expectation_vs_reality: 'Expectation vs reality',
  hidden_cost: 'Hidden cost',
  rule_experience: 'Rules in practice',
  safety_report: 'Personal safety experience',
}

export default function ReviewCard({ r, showProperty = false }: { r: Review; showProperty?: boolean }) {
  const { toast } = useStore()
  const [helpful, setHelpful] = useState(r.helpful_count)
  const [voted, setVoted] = useState(false)
  const stay = r.currently_staying ? `Living here since ${formatDate(r.stay_start, { month: 'short', year: 'numeric' })}` : `Stayed ${formatDate(r.stay_start, { month: 'short', year: 'numeric' })} – ${formatDate(r.stay_end, { month: 'short', year: 'numeric' })}`

  const markHelpful = () =>
    api
      .helpful(r.id)
      .then((x) => {
        setHelpful(x.helpful_count)
        setVoted(true)
        toast('Marked as helpful')
      })
      .catch((e) => toast(e.message))
  const report = () =>
    api
      .report(r.id, 'Reported from the review card')
      .then((x) => toast(x.message))
      .catch((e) => toast(e.message))

  return (
    <article className="review" id={r.id}>
      <div className="review-head">
        <div className="reviewer">
          <span className="r-avatar">{r.display_name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
          <div>
            <b>{r.display_name}</b>
            <span>
              {stay} · posted {formatDate(r.created_at, { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <span className="review-stars" aria-label={`${r.overall_rating} out of 5`}>
          <StarFill size={14} style={{ verticalAlign: -2 }} /> {r.overall_rating}.0
        </span>
      </div>
      {showProperty && (
        <Link to={`/property/${r.property.slug}`} className="review-place">
          {r.property.name} · {r.property.sub_area}
        </Link>
      )}
      <h4>{r.title}</h4>
      <p>{r.body}</p>
      <div className="review-tags">
        {r.is_sample && (
          <span className="badge badge-demo" title="Fictional sample written for the demo">
            Sample review
          </span>
        )}
        {r.verified_resident ? (
          <span className="badge badge-verified">
            <Shield size={12} /> Stay verified{r.is_sample ? ' (demo)' : ''}
          </span>
        ) : (
          <span className="badge badge-soft">Stay not verified</span>
        )}
        <span className={`badge ${r.review_type === 'safety_report' ? 'badge-resident' : 'badge-soft'}`}>{TYPE_LABEL[r.review_type]}</span>
      </div>
      {r.review_type === 'safety_report' && (
        <p className="tiny muted review-disclaimer">
          <Info size={12} /> One resident’s personal experience. Not a finding about the property.
        </p>
      )}
      <div className="helpful-row">
        <button className="helpful-btn" onClick={markHelpful} disabled={voted}>
          <ThumbsUp size={14} /> Helpful ({helpful})
        </button>
        <button className="helpful-btn" onClick={report}>
          <AlertTriangle size={14} /> Report
        </button>
      </div>
    </article>
  )
}
