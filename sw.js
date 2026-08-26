const CACHE_NAME = 'campus-hub-v6';

// Files that must be available offline from the start
const PRE_CACHE = [
  '/campushub/',
  '/campushub/index.html',
  '/campushub/learning.html',
  '/campushub/library.html',
  '/campushub/mfolozi.png',
  '/campushub/manifest.json',
  '/campushub/app-icon-large.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap'
];

// Install - pre-cache important files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching core files...');
        return cache.addAll(PRE_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Pre-cache failed:', err))
  );
});

// Activate - remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Cache First strategy + automatic caching of new files
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return from cache if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Not in cache → try network
      return fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          // Clone the response because it can only be read once
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // 3. Offline and not in cache → show main page as fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/campushub/index.html');
          }
        });
    })
  );
});
