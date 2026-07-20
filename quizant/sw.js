/* Trivium service worker — precache the whole app so it runs offline
   and launches instantly from the home screen. Bump CACHE on every deploy
   of index.html/support.js so clients pick up the new version. */
const CACHE = 'trivium-v3';
const PRECACHE = [
  './',
  './support.js',
  './manifest.webmanifest',
  './icon.png',
  './icon-192.png',
  './apple-touch-icon.png',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './vendor/fonts/google.css',
  './vendor/fonts/f1.woff2', './vendor/fonts/f2.woff2', './vendor/fonts/f3.woff2',
  './vendor/fonts/f4.woff2', './vendor/fonts/f5.woff2', './vendor/fonts/f6.woff2',
  './vendor/fonts/f7.woff2', './vendor/fonts/f8.woff2', './vendor/fonts/f9.woff2',
  './vendor/phosphor/regular.css', './vendor/phosphor/bold.css', './vendor/phosphor/fill.css',
  './vendor/phosphor/Phosphor.woff2', './vendor/phosphor/Phosphor-Bold.woff2', './vendor/phosphor/Phosphor-Fill.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // everything the app needs is same-origin
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        // offline navigation fallback → the cached app shell
        if (e.request.mode === 'navigate') return caches.match('./');
        throw new Error('offline');
      });
    })
  );
});
