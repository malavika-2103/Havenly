import { Info } from './Icons'

export const DEMO_NOTICE = 'Demo data for presentation. Listings and reviews are fictional samples.'

export default function DemoNotice({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <p className={`demo-notice demo-notice-${tone}`} role="note">
      <Info size={14} /> {DEMO_NOTICE}
    </p>
  )
}
