/* Crucigramas del Bosque — service worker. Los archivos con ?v= no cambian nunca: caché primero (arranca al
   instante y anda sin señal). El resto, red primero con la caché de respaldo. Se sube la versión con cada publicación. */
const VERSION = 'cb-v1.0.0';
const V = '?v=1.0.0';
const ARCHIVOS = [
  './', './index.html', './manifest.json', './privacidad.html', './terminos.html',
  './kit/kit.css' + V, './css/juego.css' + V,
  ...['silabo', 'mago', 'escena', 'audio'].map((f) => './kit/' + f + '.js' + V),
  ...['generador', 'personajes', 'tarjeta', 'ranking', 'app'].map((f) => './js/' + f + '.js' + V),
  './data/es/temas.js' + V, './data/es/temas2.js' + V,
  ...['fredoka-400', 'fredoka-600', 'fredoka-700', 'nunito-400', 'nunito-700', 'nunito-800'].map((f) => './kit/fonts/' + f + '.woff2'),
  './assets/img/icon-192x192.png', './assets/img/icon-512x512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // el ranking (Supabase) va directo a la red
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!local && url.search.includes('v=')) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((k) => k.put(e.request, c)); } return res; })));
    return;
  }
  e.respondWith(fetch(e.request).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((k) => k.put(e.request, c)); } return res; }).catch(() => caches.match(e.request)));
});
