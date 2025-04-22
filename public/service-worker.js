
const CACHE_NAME = 'v1_static_cache';

const profileImagePaths = Array.from({ length: 20 }, (_, i) => `/super_tema_copy/profiles/user${i + 1}.jpg`);

const urlsToCache = [
  // HTML
  '/super_tema_copy/html/index.html',
  '/super_tema_copy/html/call_detail.html',
  '/super_tema_copy/html/call.html',
  '/super_tema_copy/html/login.html',
  '/super_tema_copy/html/main.html',
  '/super_tema_copy/html/navbar.html',
  '/super_tema_copy/html/profile_public.html',
  '/super_tema_copy/html/profile.html',
  '/super_tema_copy/html/signup.html',

  // CSS
  '/super_tema_copy/css/style.css',

  // JS
  //'/super_tema_copy/js/auth.js',
  //'/super_tema_copy/js/call_detail.js',
  //'/super_tema_copy/js/load_navbar.js',
  //'/super_tema_copy/js/main_call.js',
  //'/super_tema_copy/js/profile.js',
  //'/super_tema_copy/js/call.js',
  //'/super_tema_copy/main.js',

  '/super_tema_copy/manifest.json',
  '/super_tema_copy/web-app-manifest-192x192.png',
  '/super_tema_copy/web-app-manifest-512x512.png',

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
