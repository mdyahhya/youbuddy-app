// ============================================================================
// Service Worker for YouBuddy PWA
// ============================================================================

const CACHE_NAME = 'youbuddy-shell-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './css/design-system.css',
  './css/components.css',
  './css/feed.css',
  './css/notes.css',
  './css/profile.css',
  './css/admin.css',
  './js/config.js',
  './js/icons.js',
  './js/supabase-client.js',
  './js/services/auth.service.js',
  './js/services/pwa.service.js',
  './js/services/feed.service.js',
  './js/services/notes.service.js',
  './js/services/admin.service.js',
  './js/views/feed.view.js',
  './js/views/notes.view.js',
  './js/views/courses.view.js',
  './js/views/games.view.js',
  './js/views/profile.view.js',
  './js/views/university-modal.js',
  './js/views/admin.view.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Caching failed during install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and external API / Supabase requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Network-first for dynamic or external requests, Cache-first fallback for local shell
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Network-first for external assets
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
