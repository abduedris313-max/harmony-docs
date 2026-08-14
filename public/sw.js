const CACHE_NAME = 'pdf-md-reader-v4';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('SW Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Skip non-http schemes and server API routes
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.includes('/api/')) return;

  // Stale-While-Revalidate strategy for static assets & CDN workers
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fetch fails and we don't have cachedResponse, return offline HTML fallback for pages
          if (!cachedResponse && event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html') || caches.match('/index.html');
          }
          return cachedResponse || new Response('Offline resource unavailable', { status: 503, statusText: 'Offline' });
        });

      return cachedResponse || fetchPromise;
    })
  );
});
