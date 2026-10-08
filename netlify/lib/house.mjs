import { blobStore, isNative, queueNative } from './fn.mjs';

// What Gwen's house, her PC side and the phone share through DayTrack.exe (see desktop/API.md)

export function localNow(tz) {
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
export const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export function inQuiet(min, q) {
  if (!q || !q.on) return false;
  const f = toMin(q.from), t = toMin(q.to);
  return f <= t ? (min >= f && min < t) : (min >= f || min < t); // window can cross midnight
}

export const keyOk = k => !!process.env.GWEN_KEY && k === process.env.GWEN_KEY;
export const dayAdd = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const dayDiff = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 864e5);

// "data:image/jpeg;base64,..." → a smaller JPEG data URL. DayTrack.exe shrinks with Electron (globalThis.dtThumb);
// without it (tests) a small image passes through and a big one is dropped.
const IMG = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
export function shrink(dataUrl, width) {
  const m = typeof dataUrl === 'string' && dataUrl.length < 12e6 && dataUrl.match(IMG);
  if (!m) return null;
  try {
    const out = globalThis.dtThumb && globalThis.dtThumb(Buffer.from(m[1], 'base64'), width);
    if (out) return 'data:image/jpeg;base64,' + out.toString('base64');
  } catch (e) { console.error('Thumbnail failed:', e.message); }
  return dataUrl.length < 300e3 ? dataUrl : null;
}

// Gwen texts the phone (her chat inbox + a notification), like her own check-ins do.
// quiet: during his quiet hours it lands in the chat without buzzing.
export async function gwenText(text, image) {
  const store = blobStore('daytrack'), { blobs } = await store.list();
  let sent = 0;
  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data || !data.gwen) continue;
    const g = data.gwenState = data.gwenState || {}, now = Date.now();
    g.inbox = [...(g.inbox || []), { text, at: now, ...(image ? { image } : {}) }].slice(-10);
    g.recent = [...(g.recent || []), text].slice(-5);
    await store.setJSON(key, data);
    if (isNative(data.subscription) && !inQuiet(localNow(data.tz).min, data.quiet)) await queueNative(data.subscription, { title: '💜 Gwen', body: text, gwen: true, ...(image ? { image } : {}) });
    sent++;
  }
  return sent;
}

// Days since Gwen was born and her next milestone (30, 100, 365 days)
export const BORN = () => /^\d{4}-\d{2}-\d{2}$/.test(process.env.GWEN_BORN || '') ? process.env.GWEN_BORN : '2026-09-30';
export const MILESTONES = [30, 100, 365];
export function milestone(today) {
  const days = dayDiff(today, BORN()), next = MILESTONES.find(m => m >= days);
  return { days, next: next ? { days: next, date: dayAdd(BORN(), next), today: next === days, in: next - days } : null };
}

// A parcel for the house each day he finishes everything; every 7th day of a streak it's a big one
const KINDS = ['decoration', 'plant', 'book'];
export async function parcelFor(today, completedDays, doneCount) {
  const house = blobStore('daytrack-house');
  let list = (await house.get('parcels', { type: 'json' })) || [];
  const id = 'p-' + today, have = list.find(p => p.id === id), full = new Set(completedDays || []);
  if (!full.has(today)) {
    // Unticked something after all: a parcel still waiting at the post office goes back
    if (have && have.status === 'waiting') await house.setJSON('parcels', list.filter(p => p !== have));
    return null;
  }
  if (have) return null;
  let streak = 0; while (full.has(dayAdd(today, -streak))) streak++;
  const p = { id, date: today, size: streak % 7 === 0 ? 'big' : 'small', kind: KINDS[Math.abs(dayDiff(today, '2026-01-01')) % 3],
    reason: `Rayan finished all ${doneCount} of his tasks today` + (streak > 1 ? ` (${streak} days in a row)` : ''), status: 'waiting' };
  list = [...list.filter(x => x.date >= dayAdd(today, -30)), p];
  await house.setJSON('parcels', list);
  return p;
}

// Umm al-Qura Hijri date of a YYYY-MM-DD day: {y, m, d}
const HIJRI = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
export function hijri(date) {
  const p = Object.fromEntries(HIJRI.formatToParts(new Date(date + 'T12:00:00Z')).map(x => [x.type, x.value]));
  return { y: parseInt(p.year, 10), m: Number(p.month), d: Number(p.day) };
}
// Idea 5: is it Ramadan (which day), or how long until it starts
export function ramadan(today) {
  const h = hijri(today);
  if (h.m === 9) return { today: true, day: h.d };
  let n = 1; while (n < 400 && hijri(dayAdd(today, n)).m !== 9) n++;
  return { today: false, in: n, starts: dayAdd(today, n) };
}
// The phone works out prayer times from its location and saves the next few days with its reminders
export async function phonePrayers() {
  const store = blobStore('daytrack'), { blobs } = await store.list();
  for (const { key } of blobs) {
    const d = await store.get(key, { type: 'json' });
    const today = d && localNow(d.tz).date, p = d && d.prayers && d.prayers.days && d.prayers.days[today];
    if (p) return { date: today, ...p };
  }
  return null;
}

// Idea 2: one small quest a day, taking turns between the phone, the house and the desktop.
// Whoever sees it done POSTs {event: "quest", id}; the house gives the reward.
export const QUESTS = {
  phone: { connect4: 'Beat me at Connect Four on your phone', anygame: 'Win any game against me in DayTrack', asr3: 'Finish 3 tasks before Asr',
    noon2: 'Finish 2 tasks before noon', adhkar: 'Read your morning or evening adhkar in DayTrack' },
  house: { deer: 'Find the deer in the house tonight', marshmallow: 'Toast marshmallows with me at the fire pit', walk: 'Go for a walk with me around the house',
    dance: 'Dance with me in the house', chess: 'Beat me at chess in the house', checkers: 'Beat me at checkers in the house',
    connect4: 'Beat me at Connect Four in the house', reversi: 'Beat me at Reversi in the house', uno: 'Play Uno with me in the house',
    pong: 'Beat me at Pong in the house', dishes: 'Help me with the dishes in the house', photo: 'Take a photo with me in the house',
    yasuo: 'Give Yasuo some pets in the house', puzzle: 'Help me with the jigsaw puzzle in the house', leaves: 'Jump in a leaf pile with me',
    boat: 'Row out on the pond with me', picnic: 'Have a picnic with me', fox: 'Say hi to the fox with me', piano: 'Play the piano for me in the house',
    story: 'Listen to me read a chapter by the fire' },
  pc: { hello: 'Come and talk to me on your PC', watch: 'Watch something with me on your PC' },
};
export function questFor(today) {
  const n = Math.abs(dayDiff(today, '2026-01-01')), where = ['phone', 'house', 'pc'][n % 3], kinds = Object.keys(QUESTS[where]);
  const kind = kinds[Math.floor(n / 3) % kinds.length];
  return { id: 'q-' + today, date: today, where, kind, text: QUESTS[where][kind], done: false };
}
export async function todaysQuest(today) {
  const house = blobStore('daytrack-house');
  let q = await house.get('quest', { type: 'json' });
  if (!q || q.date !== today) { q = questFor(today); await house.setJSON('quest', q); }
  return q;
}
export async function questDone(today, id, by) {
  const house = blobStore('daytrack-house'), q = await todaysQuest(today);
  if (q.id !== id) return { ok: false, error: 'Not today\'s quest', quest: q };
  if (!q.done) { q.done = true; q.doneBy = String(by || '').slice(0, 20); q.doneAt = Date.now(); await house.setJSON('quest', q); }
  return { ok: true, quest: q };
}
