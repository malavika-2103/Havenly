import { useStore } from '../lib/store'
import { Share } from './Icons'

/**
 * Opens the phone's native share sheet (WhatsApp, Messages, ...) where the browser supports it,
 * and falls back to copying the link everywhere else.
 */
export default function ShareButton({ title, text, path }: { title: string; text: string; path: string }) {
  const { toast } = useStore()
  const url = new URL(path, window.location.origin).toString()

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return // the person closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied. Paste it anywhere to share this place.')
    } catch {
      window.prompt('Copy this link to share the place:', url)
    }
  }

  return (
    <button type="button" className="btn btn-sm btn-outline" onClick={share} aria-label={`Share ${title}`}>
      <Share size={16} /> Share
    </button>
  )
}
