import type { FactSource } from '../../shared/types'
import { Shield, Users, Info } from './Icons'
import { formatDate } from '../lib/api'

const TEXT: Record<FactSource, string> = {
  owner_listed: 'Listed by owner',
  platform_verified: 'Verified by Havenly',
  resident_reported: 'Reported by residents',
}

/** The three-source label. Verified facts carry their date and a demo marker. */
export default function SourceBadge({ source, verifiedAt, compact = false }: { source: FactSource; verifiedAt?: string | null; compact?: boolean }) {
  const Icon = source === 'platform_verified' ? Shield : source === 'resident_reported' ? Users : Info
  const title =
    source === 'platform_verified'
      ? `Checked by Havenly${verifiedAt ? ` on ${formatDate(verifiedAt)}` : ''}. Demo verification record.`
      : source === 'resident_reported'
        ? 'Reported by residents in reviews. Not confirmed.'
        : 'As listed by the owner. Not yet checked by Havenly.'
  return (
    <span className={`src-badge src-${source}`} title={title}>
      <Icon size={12} />
      {!compact && <span>{TEXT[source]}</span>}
      {source === 'platform_verified' && !compact && <span className="src-demo">demo</span>}
    </span>
  )
}
