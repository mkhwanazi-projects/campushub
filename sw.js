const CACHE_NAME = 'campus-hub-v3';

const ASSETS_TO_CACHE = [
  '/campushub/',
  '/campushub/index.html',
  '/campushub/learning.html',
  '/campushub/library.html',
  '/campushub/mfolozi.png',
  '/campushub/manifest.json',
  '/campushub/app-icon-large.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&display=swap'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/campushub/index.html');
            }
          });
      })
  );
});
