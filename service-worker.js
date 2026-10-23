// RAVIN QC Audit — offline cache for the app shell.
// All visit/audit data lives in the browser's localStorage, not here;
// this file only lets the page itself load with no network connection.
const CACHE_NAME = 'ravin-qc-audit-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the external CDN assets (fonts / xlsx library) so they
// stay up to date when online; cache-first for the app shell so the tool
// still opens with no connection in a branch.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isAppShell = APP_SHELL.some((path) => req.url.endsWith(path.replace('./', '/')));

  if (isAppShell) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
