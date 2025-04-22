
const CACHE_NAME = 'v1_static_cache';

const profileImagePaths = Array.from({ length: 20 }, (_, i) => `/profiles/user${i + 1}.jpg`);

const urlsToCache = [
  // HTML
  '/html/index.html',
  '/html/call_detail.html',
  '/html/call.html',
  '/html/login.html',
  '/html/main.html',
  '/html/navbar.html',
  '/html/profile_public.html',
  '/html/profile.html',
  '/html/signup.html',

  // CSS
  '/css/style.css',
  '/styles/style.css',

  // JS
  '/js/auth.js',
  '/js/call_detail.js',
  '/js/load_navbar.js',
  '/js/main_call.js',
  '/js/profile.js',
  '/js/call.js',
  '/main.js',

  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',

  // Fotos de perfil
  ...profileImagePaths,
];

// Evento de instalación: se cachean los archivos esenciales
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos esenciales...');
        return Promise.allSettled(
          urlsToCache.map(url =>
            fetch(url)
              .then(response => {
                if (!response.ok) throw new Error(`${url} -> ${response.status}`);
                return cache.put(url, response);
              })
          )
        ).then(results => {
          results.forEach((result, i) => {
            if (result.status === 'rejected') {
              console.warn('[SW] Falló cachear:', urlsToCache[i], result.reason);
            } else {
              console.log('[SW] Cacheado con éxito:', urlsToCache[i]);
            }
          });
        });
      })
  );
  self.skipWaiting();
});

// Evento de activación: se limpian caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch:', event.request.url);
  const request = event.request;

  if (
    request.url.includes('@vite') ||
    request.url.includes('chrome-extension') 
  ) {
    return;
  }

  // Intentamos responder primero con cache
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (
            request.method === 'GET' &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseClone = networkResponse.clone();
            caches.open('dynamic-data').then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        });
    })
  );
});
