import { lambda, blobStore } from '../lib/fn.mjs';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { subscription, tasks, completedDays, tz, quiet, gwen, moods, gwenWake, gwenBed, gwenCheered, gwenLoc, gwenStudy } = JSON.parse(event.body);
    if (!subscription || !subscription.keys || !subscription.keys.auth) {
      console.log('Missing subscription or keys');
      return { statusCode: 400, body: 'Missing subscription' };
    }
    const key = subscription.keys.auth;
    const store = blobStore('daytrack');
    // Keep what the server remembers about already-sent reminders, unless that reminder was changed
    const old = (await store.get(key, { type: 'json' })) || {};
    const prev = Object.fromEntries((old.tasks || []).map(t => [t.id, t]));
    const merged = tasks.map(t => {
      const p = prev[t.id];
      if (!p || JSON.stringify(p.reminder) !== JSON.stringify(t.reminder)) return t;
      return { ...t, lastFiredDate: p.lastFiredDate, lastFiredMs: p.lastFiredMs, snoozeUntil: p.snoozeUntil, followed: p.followed };
    });
    // ...old keeps what only the server tracks (weekly summary, Gwen's messages)
    await store.setJSON(key, { ...old, subscription, tasks: merged, completedDays: completedDays || [], tz: tz || old.tz, quiet: quiet || old.quiet, gwen: !!gwen, moods: moods || {},
      // Gwen's wake-up and bedtime messages, and the day she already cheered him in the app
      gwenWake: hhmm(gwenWake), gwenBed: hhmm(gwenBed), gwenCheered: /^\d{4}-\d{2}-\d{2}$/.test(gwenCheered || '') ? gwenCheered : null,
      // Rough location for her weather (about 10 km), and a study session's end for a "time's up" push
      gwenLoc: gwenLoc && Math.abs(gwenLoc.lat) <= 90 && Math.abs(gwenLoc.lon) <= 180 ? { lat: Math.round(gwenLoc.lat * 10) / 10, lon: Math.round(gwenLoc.lon * 10) / 10 } : null,
      gwenStudy: gwenStudy && Number.isFinite(gwenStudy.end) && gwenStudy.end > Date.now() ? { end: gwenStudy.end, mins: Math.min(240, Math.max(1, Math.round(gwenStudy.mins) || 25)), what: String(gwenStudy.what || 'studying').slice(0, 60) } : null });
    console.log(`Saved subscription key=${key.slice(0,8)}... tasks=${tasks.length} tz=${tz}`);
    // The push service said this phone's subscription expired: tell the app to make a new one
    const gone = !!(old.subscription && old.subscription.gone && old.subscription.endpoint === subscription.endpoint);
    return { statusCode: 200, body: JSON.stringify({ ok: true, gone }), headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    console.error('Error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};
const hhmm = v => /^\d{2}:\d{2}$/.test(v || '') ? v : null;
export default lambda(handler);
