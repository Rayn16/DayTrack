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
  const isSunday = now.getDay() === 0;
  const isSummaryTime = nowMin >= 20 * 60 && nowMin <= 20 * 60 + 2;

  console.log(`Found ${blobs.length} subscription(s) in store`);

  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data) { console.log(`Key ${key}: no data`); continue; }

    const { subscription, tasks = [], completedDays = [] } = data;
    let changed = false;

    // Task reminders
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
        console.log(`Task "${t.name}": interval ${r.h}h${r.m}m, ms=${ms}, since last=${nowMs-(t.lastFiredMs||0)}`);
        if (ms > 0 && nowMs - (t.lastFiredMs || 0) >= ms) {
          await notify(webpush, subscription, `Reminder: ${t.name}`);
          t.lastFiredMs = nowMs;
          changed = true;
        }
      }
    }

    // Weekly summary (Sundays ~8pm)
    if (isSunday && isSummaryTime && data.lastWeeklySent !== todStr) {
      const last7 = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        last7.push(d.toISOString().split('T')[0]);
      }
      const completedCount = last7.filter(d => completedDays.includes(d)).length;
      const msg =
        completedCount === 7 ? '🏆 Perfect week! All 7 days fully completed!' :
        completedCount >= 5 ? `⭐ Great week! ${completedCount}/7 days fully completed` :
        completedCount >= 3 ? `📊 Week recap: ${completedCount}/7 days completed` :
        '💪 New week ahead — open DayTrack to plan your goals!';
      console.log(`Weekly summary for key ${key.slice(0,8)}: ${completedCount}/7 days`);
      await notify(webpush, subscription, msg);
      data.lastWeeklySent = todStr;
      changed = true;
    }

    if (changed) await store.setJSON(key, { ...data, subscription, tasks });
  }

  return { statusCode: 200 };
};

async function notify(webpush, subscription, body) {
  try {
    console.log('Sending push:', body);
    const result = await webpush.sendNotification(subscription, JSON.stringify({ title: '⏰ DayTrack', body }));
    console.log('Push sent, status:', result.statusCode);
  } catch (e) {
    console.error('Notify error:', e.statusCode, e.message, e.body);
  }
}
