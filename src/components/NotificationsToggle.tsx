import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { api } from '../lib/api'
import { disablePush, enablePush, pushState, type PushState } from '../lib/push'
import { Bell } from './Icons'

/** Opt-in for push notifications about booking replies and waitlist openings. */
export default function NotificationsToggle({ compact = false }: { compact?: boolean }) {
  const { toast, user } = useStore()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    pushState().then(setState).catch(() => setState('unsupported'))
  }, [])

  const run = async (fn: () => Promise<PushState | void>, done?: string) => {
    setBusy(true)
    try {
      const next = await fn()
      if (next) setState(next)
      if (done) toast(done)
    } catch (e) {
      toast((e as Error).message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (state === null || !user) return null

  const text: Record<PushState, string> = {
    on: 'Notifications are on for this device. We’ll tell you when a request is answered or a waitlisted bed opens up.',
    off: 'Get a notification when an owner answers your request or a bed opens up on your waitlist.',
    denied: 'Notifications are blocked for this site. Allow them in your browser’s site settings to turn them on.',
    unsupported: 'This browser can’t show notifications from Havenly. On iPhone, add Havenly to your Home Screen first.',
  }

  return (
    <div className={`notify-card${compact ? ' compact' : ''}`} role="region" aria-label="Notifications">
      <Bell size={compact ? 18 : 22} aria-hidden="true" />
      <p>{text[state]}</p>
      <div className="notify-actions">
        {state === 'off' && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(enablePush, 'Notifications turned on')}>
            Turn on notifications
          </button>
        )}
        {state === 'on' && !compact && (
          <>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(async () => void (await api.pushTest()), 'Test notification sent')}>
              Send a test
            </button>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(disablePush, 'Notifications turned off')}>
              Turn off
            </button>
          </>
        )}
      </div>
    </div>
  )
}
