// Service Worker for DOCUS RRHH PWA
const CACHE_NAME = 'docus-rrhh-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/docus-app-icon.png',
  '/icons/docus-full-logo.png',
  '/icons/favicon-128x128.png',
  '/icons/favicon-96x96.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones de la API de backend (Network only para datos frescos)
  if (url.pathname.startsWith('/api') || url.hostname.includes('onrender.com')) {
    return;
  }

  // Network first con fallback a cache para navegación y recursos estáticos
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
