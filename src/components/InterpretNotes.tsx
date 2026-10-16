import { FormEvent, useState } from 'react'
import type { InterpretResult } from '../../shared/types'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { Info, MapPin } from './Icons'

/** Unsupported requests (dashed chips), the clarifying question, and the out-of-coverage state. */
export default function InterpretNotes({ result, showCoverage = true }: { result: InterpretResult | null; showCoverage?: boolean }) {
  if (!result) return null
  return (
    <>
      {result.unsupported.length > 0 && (
        <div className="parsed-chips">
          <span className="hint-label">Can’t filter by:</span>
          {result.unsupported.map((u) => (
            <span key={u.text} className="chip chip-unsupported" title={u.reason}>
              {u.text}
            </span>
          ))}
          <span className="tiny muted unsupported-why">{result.unsupported[0].reason}</span>
        </div>
      )}
      {result.clarification && (
        <p className="clarify" role="status">
          <Info size={15} /> {result.clarification}
        </p>
      )}
      {showCoverage && result.out_of_coverage && <OutOfCoverage info={result.out_of_coverage} />}
    </>
  )
}

export function OutOfCoverage({ info }: { info: NonNullable<InterpretResult['out_of_coverage']> }) {
  const { toast } = useStore()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!info.area_slug) return
    setError(null)
    api
      .areaWaitlist(email, info.area_slug)
      .then((r) => {
        setDone(true)
        toast(r.message)
      })
      .catch((err) => setError(err.message))
  }
  return (
    <div className="coverage-card" role="status">
      <MapPin size={22} />
      <div>
        <b>{info.coming_soon ? `${info.place} is coming soon` : `Not in ${info.place} yet`}</b>
        <p>{info.message}</p>
        {info.coming_soon && !done && (
          <form className="coverage-form" onSubmit={submit}>
            <label htmlFor="coverage-email" className="sr-only">
              Email
            </label>
            <input id="coverage-email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-primary btn-sm" type="submit">
              Tell me when it opens
            </button>
          </form>
        )}
        {done && <p className="tiny">You’re on the list for {info.place}.</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}
