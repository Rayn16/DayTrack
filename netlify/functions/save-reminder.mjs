import { lambda, blobStore } from '../lib/fn.mjs';
import { localNow, parcelFor, trophyParcels } from '../lib/house.mjs';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { subscription, tasks, completedDays, tz, quiet, gwen, moods, gwenWake, gwenBed, gwenCheered, gwenLoc, gwenStudy, prayers, goals, sleep, adhkar, spend, events, trophies, nudges } = JSON.parse(event.body);
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
      gwenStudy: gwenStudy && Number.isFinite(gwenStudy.end) && gwenStudy.end > Date.now() ? { end: gwenStudy.end, mins: Math.min(240, Math.max(1, Math.round(gwenStudy.mins) || 25)), what: String(gwenStudy.what || 'studying').slice(0, 60) } : null,
      // Prayer times worked out on the phone for the next days ({remind, days: {date: {Fajr: 'HH:MM', ...}}}), his goals and sleep log for Gwen
      prayers: prayers && typeof prayers.days === 'object' && JSON.stringify(prayers).length < 5000 ? { remind: !!prayers.remind, days: prayers.days } : null,
      goals: Array.isArray(goals) ? goals.slice(0, 20).map(g => ({ name: String(g.name || '').slice(0, 80), done: g.done | 0, total: g.total | 0, lastAt: /^\d{4}-\d{2}-\d{2}$/.test(g.lastAt || '') ? g.lastAt : null })) : [],
      sleep: sleep && typeof sleep === 'object' && JSON.stringify(sleep).length < 3000 ? sleep : {},
      // Adhkar reminders after Fajr and Asr, his spending this week and last (SAR, by category), today's phone-calendar events
      adhkar: !!adhkar, spend: spend && typeof spend === 'object' && JSON.stringify(spend).length < 2000 ? spend : null,
      events: Array.isArray(events) ? events.slice(0, 12).map(e => ({ title: String(e.title || '').slice(0, 80), at: /^\d{2}:\d{2}$/.test(e.at || '') ? e.at : null })) : [],
      // Water, bills, Gwen's top 3, the weekly photo: the app works out what and when, the server fires them on the minute
      nudges: Array.isArray(nudges) ? nudges.filter(n => n && /^\d{4}-\d{2}-\d{2}$/.test(n.date || '') && hhmm(n.at)).slice(0, 20)
        .map(n => ({ id: String(n.id || '').slice(0, 40), date: n.date, at: n.at, title: String(n.title || '⏰ DayTrack').slice(0, 50), text: String(n.text || '').slice(0, 240) })) : [] });
    // Finished every task today: a parcel goes to Gwen's house
    const today = localNow(tz).date;
    await parcelFor(today, completedDays, tasks.filter(t => (t.done || []).includes(today)).length).catch(e => console.error('Parcel:', e.message));
    // Bosses beaten in the level system: a trophy each
    await trophyParcels(trophies).catch(e => console.error('Trophy:', e.message));
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
