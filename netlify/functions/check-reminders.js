const { getStore } = require('@netlify/blobs');
const webpush = require('web-push');

exports.handler = async () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !NETLIFY_SITE_ID || !NETLIFY_AUTH_TOKEN) {
    console.log('Missing env vars:', { VAPID_PUBLIC_KEY: !!VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY: !!VAPID_PRIVATE_KEY, NETLIFY_SITE_ID: !!NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN: !!NETLIFY_AUTH_TOKEN });
    return { statusCode: 200 };
  }

  webpush.setVapidDetails('mailto:r.alljhanii.4@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const store = getStore({ name: 'daytrack', consistency: 'strong', siteID: NETLIFY_SITE_ID, token: NETLIFY_AUTH_TOKEN });
  const { blobs } = await store.list();

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowMs = Date.now();
  const todStr = now.toISOString().split('T')[0];

  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data || !data.tasks?.length) continue;

    const { subscription, tasks } = data;
    let changed = false;

    for (const t of tasks) {
      if (!t.reminder) continue;
      const r = t.reminder;

      if (r.type === 'time') {
        const timeStr = typeof r === 'string' ? r : r.time;
        const [rh, rm] = timeStr.split(':').map(Number);
        if (Math.abs(nowMin - (rh * 60 + rm)) <= 1 && t.lastFiredDate !== todStr) {
          await notify(webpush, subscription, `Time for: ${t.name}`);
          t.lastFiredDate = todStr;
          changed = true;
        }
      } else if (r.type === 'interval') {
        const ms = (r.h * 60 + r.m) * 60000;
        if (ms > 0 && nowMs - (t.lastFiredMs || 0) >= ms) {
          await notify(webpush, subscription, `Reminder: ${t.name}`);
          t.lastFiredMs = nowMs;
          changed = true;
        }
      }
    }

    if (changed) await store.setJSON(key, { subscription, tasks });
  }

  return { statusCode: 200 };
};

async function notify(webpush, subscription, body) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title: '⏰ DayTrack', body }));
  } catch (e) {
    console.error('Notify error:', e.message);
  }
}
