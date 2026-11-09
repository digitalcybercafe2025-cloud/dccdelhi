const CACHE_NAME = 'dcc-pwa-cache-v3';

self.addEventListener('install', (event) => {
    // Force new service worker to activate immediately without waiting for old tabs to close
    self.skipWaiting();
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
    const request = event.request;

    // For HTML navigation requests, ALWAYS fetch from network so user gets the latest HTML & JS bundle hashes!
    if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // For other assets, try network first, then fall back to cache
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && request.method === 'GET' && (request.url.includes('/assets/') || request.url.includes('/images/'))) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(request))
    );
});
