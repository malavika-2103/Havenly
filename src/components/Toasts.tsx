import { useStore } from '../lib/store'
import { Check } from './Icons'

export default function Toasts() {
  const { toasts } = useStore()
  if (toasts.length === 0) return null
  const last = toasts[toasts.length - 1]
  return (
    <div className="toast" role="status">
      <Check size={17} /> {last.message}
    </div>
  )
}
