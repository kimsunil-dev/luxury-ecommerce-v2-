const CACHE_NAME = 'sir-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/products.html',
    '/product.html',
    '/assets/css/style.css',
    '/assets/js/data.js',
    '/assets/js/nav.js',
    '/assets/js/promo.js',
    '/assets/js/cart.js',
    '/assets/js/store.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Return network response and update cache
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Fallback to cache if offline
                return caches.match(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
