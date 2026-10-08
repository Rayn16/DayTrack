const CACHE = 'daytrack-v5';
const FILES = ['./', './index.html', './levels.js', './levels.css', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE && k !== 'dt-actions' && k !== 'gwen-model').map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network first so new uploads show up right away; the saved copy is only used offline
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/.netlify/')) return;
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
  opts.data = { taskId: data.taskId, gwen: data.gwen };
  if (data.taskId) opts.actions = [{ action: 'done', title: '✅ Done' }, data.gwen ? { action: 'tomorrow', title: '📅 Tomorrow' } : { action: 'snooze', title: '⏰ 10 min' }];
  if (data.gwen) { opts.tag = 'gwen'; opts.renotify = true; } // a new message replaces the old one and still alerts
  e.waitUntil(self.registration.showNotification(data.title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { taskId: id, gwen } = e.notification.data || {};
  if (!id || !e.action) {
    // Gwen's messages open her chat
    e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
      if (!cs.length) return clients.openWindow(gwen ? './?tab=gwen' : './');
      if (gwen) cs[0].postMessage('gwen-open');
      return cs[0].focus();
    }));
    return;
  }
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const d = new Date(), date = e.action === 'tomorrow' ? ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) : ymd(d);
  e.waitUntil((async () => {
    if (e.action === 'done' || e.action === 'tomorrow') {
      // The page applies this next time it's open (it can't be reached from here)
      await (await caches.open('dt-actions')).put(`./__${e.action === 'done' ? 'done' : 'move'}/${id}/${date}`, new Response(''));
      (await clients.matchAll({ type: 'window' })).forEach(c => c.postMessage('dt-actions'));
    }
    // Tell the reminder server so it stops (done), moves it (tomorrow) or comes back in 10 minutes (snooze)
    const sub = await self.registration.pushManager.getSubscription();
    if (sub) await fetch('/.netlify/functions/reminder-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth: sub.toJSON().keys.auth, taskId: id, action: e.action, date }),
    }).catch(() => {});
  })());
});
