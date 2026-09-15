const CACHE_NAME = 'campus-hub-v7';

// Core files that must work offline
const PRE_CACHE = [
  '/campushub/',
  '/campushub/index.html',
  '/campushub/learning.html',
  '/campushub/library.html',
  '/campushub/mfolozi.png',
  '/campushub/logo.jpg',
  '/campushub/manifest.json',
  '/campushub/app-icon-large.png',
  '/campushub/timetable.pdf',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap'
];

// Install
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

// Activate - clean old caches
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

// Fetch strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Don't cache Google Vision or TensorFlow requests
  if (event.request.url.includes('vision.googleapis.com') ||
      event.request.url.includes('tensorflow') ||
      event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/campushub/index.html');
          }
        });
    })
  );
});
