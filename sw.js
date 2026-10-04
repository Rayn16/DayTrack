const CACHE = 'daytrack-v4';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network first so new uploads show up right away; the saved copy is only used offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});

self.addEventListener('push', e => {
  let data = { title: '⏰ DayTrack', body: 'Reminder!', notifStyle: 'default' };
  try { data = e.data.json(); } catch(_) { data.body = e.data ? e.data.text() : 'Reminder!'; }
  const style = data.notifStyle || 'default';
  const opts = {
    body: data.body,
    icon: './icon.svg',
    badge: './icon.svg',
  };
  if (style === 'vibrate' || style === 'both') opts.vibrate = [200, 100, 200, 100, 200];
  if (style === 'sound' || style === 'default' || style === 'both') {} // sound is default browser behavior
  if (style === 'vibrate') opts.silent = true; // vibrate only — suppress sound
  e.waitUntil(self.registration.showNotification(data.title, opts));
});
