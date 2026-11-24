const CACHE_NAME = 'utbk-static-v1'
const PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/assets/images/ichigo-logo.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('utbk-static-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    request.mode === 'navigate'
  ) {
    return
  }

  if (
    !url.pathname.startsWith('/_nuxt/') &&
    !['manifest', 'script', 'style', 'font', 'image'].includes(request.destination)
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request).then((response) => {
        if (!response.ok || response.type !== 'basic') return response

        return caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, response.clone()))
          .catch((error) => {
            console.warn('Static asset could not be cached.', error)
          })
          .then(() => response)
      })
    }),
  )
})
