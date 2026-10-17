// Havenly service worker: shows push notifications and opens the right page when one is tapped.
// It does not cache anything yet.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'Havenly'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: typeof data.tag === 'string' ? data.tag : undefined,
      data: { url: typeof data.url === 'string' ? data.url : '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Only ever open pages on this site, whatever the payload says.
  let target = new URL('/', self.location.origin)
  try {
    const u = new URL(event.notification.data?.url ?? '/', self.location.origin)
    if (u.origin === self.location.origin) target = u
  } catch {
    /* keep the home page */
  }
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin && 'focus' in w) {
          await w.focus()
          if ('navigate' in w) await w.navigate(target.href)
          return
        }
      }
      await self.clients.openWindow(target.href)
    })(),
  )
})
