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

  const nowMs = Date.now();

  console.log(`Found ${blobs.length} subscription(s) in store`);

  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data) { console.log(`Key ${key}: no data`); continue; }

    const { subscription, tasks = [], completedDays = [] } = data;
    // The server clock is UTC, so work in the phone's own timezone
    const { min: nowMin, date: todStr, dow } = localNow(data.tz);
    const isSunday = dow === 0;
    const isSummaryTime = nowMin >= 20 * 60 && nowMin <= 20 * 60 + 2;
    let changed = false;

    // Task reminders
    for (const t of tasks) {
      if (!t.reminder) continue;
      const r = t.reminder;
      const done = t.done || [];
      if (t.recurring && t.days && t.days.length && !t.days.includes(dow)) continue; // not one of its days
      if (done.includes(todStr) || (!t.recurring && done.length)) continue;            // already done
      if (!t.recurring && t.date && t.date > todStr) continue;                          // dated for later

      if (t.snoozeUntil && nowMs >= t.snoozeUntil) {
        await notify(webpush, subscription, `Snoozed: ${t.name}`, t.notifStyle, t.id);
        t.snoozeUntil = null;
        changed = true;
        continue;
      }

      const timeStr = typeof r === 'string' ? r : r.type === 'time' ? r.time : null;
      if (timeStr) {
        const [rh, rm] = timeStr.split(':').map(Number);
        if (Math.abs(nowMin - (rh * 60 + rm)) <= 1 && t.lastFiredDate !== todStr) {
          await notify(webpush, subscription, `Time for: ${t.name}`, t.notifStyle, t.id);
          t.lastFiredDate = todStr;
          changed = true;
        }
      } else if (r.type === 'interval') {
        const ms = (r.h * 60 + r.m) * 60000;
        console.log(`Task "${t.name}": interval ${r.h}h${r.m}m, ms=${ms}, since last=${nowMs-(t.lastFiredMs||0)}`);
        if (inQuiet(nowMin, data.quiet)) continue; // fires again once quiet hours end
        if (ms > 0 && !t.lastFiredMs) {
          t.lastFiredMs = nowMs; // start counting from now, first reminder after one interval
          changed = true;
        } else if (ms > 0 && nowMs - t.lastFiredMs >= ms) {
          await notify(webpush, subscription, `Reminder: ${t.name}`, t.notifStyle, t.id);
          t.lastFiredMs = nowMs;
          changed = true;
        }
      }
    }

    // Weekly summary (Sundays ~8pm)
    if (isSunday && isSummaryTime && data.lastWeeklySent !== todStr) {
      const last7 = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(todStr + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() - i);
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

function localNow(tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(new Date());
  } catch (_) {
    return localNow('UTC'); // unknown timezone name
  }
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return {
    min: Number(p.hour) * 60 + Number(p.minute),
    date: `${p.year}-${p.month}-${p.day}`,
    dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
  };
}

function inQuiet(min, q) {
  if (!q || !q.on) return false;
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const f = toMin(q.from), t = toMin(q.to);
  return f <= t ? (min >= f && min < t) : (min >= f || min < t); // window can cross midnight
}

async function notify(webpush, subscription, body, notifStyle = 'default', taskId) {
  try {
    console.log('Sending push:', body, 'style:', notifStyle);
    const payload = JSON.stringify({ title: '⏰ DayTrack', body, notifStyle, taskId });
    const result = await webpush.sendNotification(subscription, payload);
    console.log('Push sent, status:', result.statusCode);
  } catch (e) {
    console.error('Notify error:', e.statusCode, e.message, e.body);
  }
}
