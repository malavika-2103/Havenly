import { ReactNode } from 'react'
import { AlertTriangle, MapPin } from './Icons'

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={30} style={{ color: 'var(--mauve)' }} />
      <h3>Something didn’t load</h3>
      <p className="muted">{error.message}</p>
      {onRetry && (
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon ?? <MapPin size={30} style={{ color: 'var(--mauve)' }} />}
      <h3>{title}</h3>
      {children}
    </div>
  )
}
