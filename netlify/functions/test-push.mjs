import { lambda, isNative, queueNative } from '../lib/fn.mjs';
import webpush from 'web-push';

// Settings → "Send a test notification": one push to this phone right away, with the push service's answer
const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  const res = d => ({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  let sub;
  try { sub = JSON.parse(event.body).subscription; } catch (_) {}
  if (!sub || !sub.endpoint || !sub.keys) return res({ ok: false, error: 'no subscription' });
  if (isNative(sub)) { await queueNative(sub, { title: '🔔 DayTrack', body: 'Test notification: it works!' }); return res({ ok: true }); }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return res({ ok: false, error: 'push keys missing on the server' });
  webpush.setVapidDetails('mailto:r.alljhanii.4@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  try {
    const r = await webpush.sendNotification(sub, JSON.stringify({ title: '🔔 DayTrack', body: 'Test notification: it works!' }), { urgency: 'high', TTL: 120 });
    return res({ ok: true, status: r.statusCode });
  } catch (e) {
    console.error('Test push failed:', e.statusCode, e.body || e.message);
    return res({ ok: false, status: e.statusCode, error: String(e.body || e.message || 'failed').slice(0, 200) });
  }
};
export default lambda(handler);
