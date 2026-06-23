const CACHE = 'daytrack-v3';
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

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
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
