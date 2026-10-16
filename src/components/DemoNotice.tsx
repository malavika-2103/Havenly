import { Info } from './Icons'
import { useStore } from '../lib/store'

/** Shown wherever demo data appears. Text comes from /api/meta; hidden when the server says there is no demo data. */
export default function DemoNotice({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { meta } = useStore()
  if (meta && !meta.demo) return null
  return (
    <p className={`demo-notice demo-notice-${tone}`} role="note">
      <Info size={14} /> {meta?.demo_notice ?? 'Demo data for presentation. Listings and reviews are fictional samples.'}
    </p>
  )
}
