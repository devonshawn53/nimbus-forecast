const CACHE_NAME = 'nimbus-forecast-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/alerts.html',
    '/styles.css',
    '/script.js',
    '/script_alerts.js',
    '/icon-192.png',
    '/icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});