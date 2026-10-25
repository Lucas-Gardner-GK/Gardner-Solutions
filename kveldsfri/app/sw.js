// Kveldsfri-demo: virker uten nett etter første besøk
const C = 'kveldsfri-app-v1';
const FILES = ['./', './index.html', './bilder/1-terrassen.jpg', './bilder/2-raate.jpg', './bilder/3-maaling.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== C).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const page = r.mode === 'navigate';
  // siden: nett først (så du alltid får nyeste versjon), ellers lagret kopi
  if (page) { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./')))); return; }
  // bilder og skrift: lagret kopi først
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; })));
});
