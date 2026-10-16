import type { CategorySummary } from '../../shared/types'

export default function RatingBars({ categories }: { categories: CategorySummary[] }) {
  return (
    <div>
      {categories.map((c) => (
        <div className="rating-bar-row" key={c.key}>
          <span>{c.label}</span>
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${((c.average ?? 0) / 5) * 100}%` }} />
          </div>
          <span className="val">{c.average != null ? c.average.toFixed(1) : '—'}</span>
        </div>
      ))}
    </div>
  )
}
