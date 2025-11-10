const CACHE_NAME = "static-cache-v2";
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/pico.classless.min.css",
    "/index.js",
    "/manifest.json",
    "/favicon.ico",
    "/icon.png",
    "/apple-touch-icon.png",
    "/mouse.png",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => cachedResponse || fetch(event.request))
    );
});
