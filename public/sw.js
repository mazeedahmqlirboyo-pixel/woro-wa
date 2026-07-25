const CACHE_NAME = 'woro-mazeeda-v2';
const assets = [
  './',
  'index.html',
  'logo.png',
  'manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting(); // Force new service worker to take over immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // For HTML requests, go to the network first (so we get the latest Vite chunks)
  if (e.request.mode === 'navigate' || e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // For everything else, use Cache First, fallback to Network
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
