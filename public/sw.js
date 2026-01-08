// Service Worker avec auto-update pour DigitalQRCard
const CACHE_NAME = 'digitalqrcard-v' + Date.now();
const urlsToCache = [
    '/',
    '/index.html'
];

// Installation
self.addEventListener('install', (event) => {
    console.log('[SW] Installing new service worker');
    // Force le nouveau SW à prendre le contrôle immédiatement
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating new service worker');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Prend le contrôle de tous les clients immédiatement
            return self.clients.claim();
        })
    );
});

// Stratégie Network First pour toujours avoir la dernière version
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone la réponse avant de la cacher
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Si le réseau échoue, utilise le cache
                return caches.match(event.request);
            })
    );
});

// Message listener pour forcer le refresh
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
