import type { Fact } from '../../shared/types'
import SourceBadge from './SourceBadge'
import { Users } from './Icons'

/** A list of facts, each labelled with where it came from. */
export default function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="fact-list">
      {facts.map((f) => (
        <div className="fact-item" key={f.field}>
          <dt>{f.label}</dt>
          <dd>
            <span className="fact-value">{f.display}</span>
            <SourceBadge source={f.source} verifiedAt={f.verified_at} />
            {f.resident_reports && (
              <span className="fact-resident">
                <Users size={12} /> Residents report: {f.resident_reports}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
