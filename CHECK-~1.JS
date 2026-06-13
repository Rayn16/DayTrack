const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  const { ONESIGNAL_APP_ID, ONESIGNAL_API_KEY } = process.env;
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) return { statusCode: 200 };

  const store = getStore({ name: 'daytrack', consistency: 'strong' });
  const { blobs } = await store.list();

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowMs = Date.now();
  const todStr = now.toISOString().split('T')[0];

  for (const { key: playerId } of blobs) {
    const tasks = await store.get(playerId, { type: 'json' });
    if (!tasks?.length) continue;

    let changed = false;

    for (const t of tasks) {
      if (!t.reminder) continue;
      const r = t.reminder;

      if (r.type === 'time') {
        // Legacy string format support
        const timeStr = typeof r === 'string' ? r : r.time;
        const [rh, rm] = timeStr.split(':').map(Number);
        if (Math.abs(nowMin - (rh * 60 + rm)) <= 1 && t.lastFiredDate !== todStr) {
          await notify(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY, playerId, `Time for: ${t.name}`);
          t.lastFiredDate = todStr;
          changed = true;
        }
      } else if (r.type === 'interval') {
        const ms = (r.h * 60 + r.m) * 60000;
        if (ms > 0 && nowMs - (t.lastFiredMs || 0) >= ms) {
          await notify(ONESIGNAL_APP_ID, ONESIGNAL_API_KEY, playerId, `Reminder: ${t.name}`);
          t.lastFiredMs = nowMs;
          changed = true;
        }
      }
    }

    if (changed) await store.setJSON(playerId, tasks);
  }

  return { statusCode: 200 };
};

async function notify(appId, apiKey, playerId, body) {
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        include_player_ids: [playerId],
        contents: { en: body },
        headings: { en: '⏰ DayTrack' },
      }),
    });
  } catch (e) {
    console.error('Notify error:', e.message);
  }
}
