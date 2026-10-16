import { CATEGORY_LABELS, Categories } from '../data/properties'

const order: (keyof Categories)[] = ['cleanliness', 'food', 'maintenance', 'management', 'privacy', 'value', 'security']

export function starString(rating: number) {
  const full = Math.round(rating)
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full)
}

export default function RatingBars({ categories }: { categories: Categories }) {
  return (
    <div>
      {order.map((key) => (
        <div className="rating-bar-row" key={key}>
          <span>{CATEGORY_LABELS[key]}</span>
          <div className="bar">
            <span style={{ width: `${(categories[key] / 5) * 100}%` }} />
          </div>
          <span className="val">{categories[key].toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}
