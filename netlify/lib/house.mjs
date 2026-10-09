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
// extra: more fields for the chat message (a `file` sent from the PC)
export async function gwenText(text, image, extra) {
  const store = blobStore('daytrack'), { blobs } = await store.list(), held = holdForPc(text, '💜 Gwen', image); // idea 36: at the PC it shows on the desktop instead
  let sent = 0;
  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data || !data.gwen) continue;
    const g = data.gwenState = data.gwenState || {}, now = Date.now();
    g.inbox = [...(g.inbox || []), { text, at: now, ...(image ? { image } : {}), ...extra }].slice(-10);
    g.recent = [...(g.recent || []), text].slice(-5);
    await store.setJSON(key, data);
    if (!held && isNative(data.subscription) && !inQuiet(localNow(data.tz).min, data.quiet)) await queueNative(data.subscription, { title: '💜 Gwen', body: text, gwen: true, ...(image ? { image } : {}) });
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

// Bosses he beat in DayTrack's level system: each one sends a trophy to the house (once)
export async function trophyParcels(list) {
  if (!Array.isArray(list) || !list.length) return;
  const house = blobStore('daytrack-house');
  let parcels = (await house.get('parcels', { type: 'json' })) || [];
  const have = new Set(parcels.map(p => p.id)), add = list.slice(0, 20)
    .filter(t => t && /^([bw]|f-[a-z]+)-\d{4}-\d{2}-\d{2}$/.test(t.id) && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !have.has('t' + t.id))
    .map(t => t.id[0] === 'f'
      ? { id: 't' + t.id, date: t.date, size: 'big', kind: 'furniture', item: String(t.item || '').slice(0, 40), reason: String(t.reason || 'Rayan built something').slice(0, 80), status: 'waiting' }
      : { id: 't' + t.id, date: t.date, size: 'big', kind: 'trophy', reason: String(t.reason || 'Rayan beat a boss').slice(0, 80), status: 'waiting' });
  if (!add.length) return;
  const lim = dayAdd(add[0].date, -30);
  await house.setJSON('parcels', [...parcels.filter(x => x.date >= lim), ...add]);
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

// ── 10-09 second round (ideas 31-51): what the phone, the house and desktop Gwen share. Contract: desktop/API.md ──

// What desktop Gwen last reported, when it last took its inbox, and when the house last polled (DayTrack.exe runs every function in one process)
export const live = { report: null, where: 'phone', since: Date.now(), inbox: [], inboxAt: 0, houseSeen: 0 };
// Idea 36: where he is. At the PC = desktop Gwen's report names an app, no game, and he touched the mouse or keys in the last 5 minutes.
export function whereNow() {
  const r = live.report, w = !r || Date.now() - r.at > 3 * 60e3 ? 'phone' : r.game ? 'gaming' : r.app && !(r.idle > 300) ? 'pc' : 'phone';
  if (w !== live.where) { live.where = w; live.since = Date.now(); }
  return { where: w, since: live.since };
}
// A text or reminder goes to the desktop instead of buzzing the phone (and waits there while he games), but only while desktop Gwen is taking them.
// ponytail: held messages live in memory; one that was held during a game and he then walked away still shows on the desktop, not the phone
export function holdForPc(text, title, image) {
  if (Date.now() - live.inboxAt > 2 * 60e3 || whereNow().where === 'phone') return false;
  if (!live.inbox.some(m => m.text === text && Date.now() - m.at < 60e3)) live.inbox = [...live.inbox, { text, ...(title ? { title } : {}), ...(image ? { image } : {}), at: Date.now() }].slice(-30);
  return true;
}

// Idea 31: a 4-week forest mystery, a chapter a week; each chapter has a clue in the house, one from desktop Gwen and one on the phone
const STORY = [
  ['Lights in the Pines', 'Every night this week a small blue light has been moving between the pines behind the cottage. Yasuo won\'t stop staring at the window, and Gwen wants to find out what it is. She needs you.',
    ['Fresh tracks by the pond: small boots, not yours and not hers, leading into the trees.', 'In the attic Gwen found an old map in someone else\'s handwriting. It marks the pond, and an X past the end of the trail.', 'A note tucked under the doormat: "Follow the light, but not alone."']],
  ['The Keeper\'s Cabin', 'The X on the map is an empty cabin deep in the forest. The door is open, the kettle is still warm, and a blue lantern sits on the table, unlit.',
    ['A journal on the cabin shelf: the forest keeper lit the lantern every night "so the lost ones can find their way home."', 'Gwen looked through the old village records: the keeper, Elian, left the village forty years ago and was never seen in town again.', 'Scratched into the cabin door: "The lantern needs three lights: a promise, a song, and a friend."']],
  ['Three Lights', 'Gwen thinks the lantern went dark because nobody keeps its promise anymore. To light it again, you need the three lights from the cabin door.',
    ['A promise: Gwen wrote one on a ribbon and tied it to the lantern. She will always leave the porch light on for you.', 'A song: Gwen hummed the tune from the keeper\'s journal, and the lantern flickered once.', 'A friend: the fox from the yard followed you both into the forest and sat down next to the lantern.']],
  ['Home', 'With all three lights the lantern burns blue again, and the path through the pines glows all the way back to the cottage. Someone has been waiting for this.',
    ['Under the lantern: a small brass key and a note, "For whoever keeps the light now."', 'Gwen worked out where the key fits: the old chest in the attic that never opened.', 'Inside the chest: the keeper\'s last letter, thanking whoever brought the light home. Gwen wants to hang the lantern on the porch.']],
].map(([title, text, clues], i) => ({ id: 'forest-' + (i + 1), title, text, clues: clues.map((t, j) => ({ id: `forest-${i + 1}-${['house', 'pc', 'phone'][j]}`, where: ['house', 'pc', 'phone'][j], text: t,
  hint: ['Look around the house and the yard', 'Ask Gwen on your PC about the story', 'Finish 3 tasks in one day'][j] })) }));
export const weekOf = d => dayAdd(d, -new Date(d + 'T12:00:00Z').getUTCDay()); // Sunday
const allFound = (s, ch) => STORY[ch].clues.every(c => s.found[c.id]);
export async function storyNow(today) {
  const h = blobStore('daytrack-house'), wk = weekOf(today);
  let s = await h.get('story', { type: 'json' });
  if (!s) await h.setJSON('story', s = { ch: 0, opened: wk, found: {} });
  // The next chapter opens the week after the last one was solved
  if (s.ch < STORY.length - 1 && allFound(s, s.ch) && wk > s.opened) { s.ch++; s.opened = wk; await h.setJSON('story', s); }
  const c = STORY[s.ch];
  return { id: c.id, chapter: s.ch + 1, of: STORY.length, title: c.title, text: c.text, clues: c.clues.map(x => ({ ...x, found: s.found[x.id] || false })),
    ends: dayAdd(s.opened, 6), solved: allFound(s, s.ch), finished: s.ch === STORY.length - 1 && allFound(s, s.ch) };
}
export async function clueFound(today, id) {
  const h = blobStore('daytrack-house'), story = await storyNow(today), c = story.clues.find(x => x.id === id);
  if (!c) return { ok: false, error: 'Not a clue of this week\'s chapter', story };
  if (!c.found) { const s = await h.get('story', { type: 'json' }); s.found[id] = Date.now(); await h.setJSON('story', s); }
  return { ok: true, story: await storyNow(today) };
}

// Idea 50: cleaning tasks he ticks become the same chore in the house
const CHORES = [['dishes', /dish|plates|صحون|مواعين/i], ['laundry', /laundry|clothes|washing|غسيل|ملابس/i], ['vacuum', /vacuum|hoover|مكنس/i],
  ['trash', /trash|garbage|rubbish|\bbins?\b|زبال|قمام/i], ['bed', /make (the |my )?bed|سرير/i], ['tidy', /tidy|clean|organi[sz]e|declutter|ترتيب|تنظيف|رتب/i]];
export const choreKind = name => (CHORES.find(([, re]) => re.test(name || '')) || [])[0] || null;
export async function choresTicked(today, prevTasks, tasks) {
  const prev = Object.fromEntries((prevTasks || []).map(t => [t.id, t])), add = (tasks || [])
    .filter(t => (t.done || []).includes(today) && !((prev[t.id] || {}).done || []).includes(today) && choreKind(t.name))
    .map(t => ({ id: t.id + '-' + today, kind: choreKind(t.name), at: Date.now() }));
  if (!add.length) return;
  const h = blobStore('daytrack-house'), list = ((await h.get('chores', { type: 'json' })) || []).filter(c => Date.now() - c.at < 864e5 && !add.some(a => a.id === c.id));
  await h.setJSON('chores', [...list, ...add].slice(-50));
}

// Everything the house and desktop Gwen read about him and the shared things (GET /api/house and GET /api/pc)
export async function sharedState(today) {
  const h = blobStore('daytrack-house'), get = k => h.get(k, { type: 'json' }), now = Date.now();
  const [app, hero, herGoals, needs, schedule, focus, chores, firsts, coins, story, pr] = await Promise.all(
    ['app', 'hero', 'herGoals', 'needs', 'schedule', 'focus', 'chores', 'firsts', 'coins'].map(get).concat(storyNow(today), phonePrayers().catch(() => null)));
  const a = app || {}, my = a.myGoals && a.myGoals.week === weekOf(today) ? a.myGoals : null, her = herGoals && herGoals.week === weekOf(today) ? herGoals : null;
  const herDone = her && her.goals.length && her.goals.every(g => g.done >= g.total), myDone = my && my.total > 0 && my.done >= my.total;
  return {
    story, myGoals: my, herGoals: her && { ...her, rewarded: !!(herDone && myDone) },
    levelUp: a.levelUp || null, boss: a.boss && a.boss.date === today ? a.boss : null, mood: a.moodDate === today ? a.mood : null,
    walking: a.walking && now - a.walking.since < 4 * 3600e3 ? a.walking : null, focus: focus && focus.until > now ? focus : null,
    hero: { ...(hero || {}), stats: a.stats || null, pet: a.pet || null }, sleep: a.sleep || { bed: null, wake: null },
    chores: (chores || []).filter(c => now - c.at < 3600e3), away: whereNow(),
    today: a.today && a.today.date === today ? a.today : { date: today, done: 0, total: 0, chatMinutes: 0 }, joins: (a.joins || []).filter(j => j.date >= today),
    needs: needs || null, schedule: schedule || [], firsts: firsts || [], coins: (coins || []).slice(-50),
    prayers: pr && { date: pr.date, fajr: pr.Fajr, dhuhr: pr.Dhuhr, asr: pr.Asr, maghrib: pr.Maghrib, isha: pr.Isha },
  };
}

// The house, desktop Gwen and the phone all send these (house `event`, PC `action`); null = not one of them
const s = (v, n) => typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null;
const int = (v, lo, hi) => v !== null && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v)) ? Math.max(lo, Math.min(hi, Math.round(Number(v)))) : null;
const hm = v => /^\d{2}:\d{2}$/.test(v || '') ? v : null;
export async function sharedEvent(today, kind, b, by) {
  const h = blobStore('daytrack-house'), get = k => h.get(k, { type: 'json' });
  switch (kind) {
    case 'clue': return clueFound(today, String(b.id || ''));
    case 'focus': {
      // Idea 45: a timer started anywhere puts all three in focus; minutes 0 ends it
      const m = int(b.minutes, 0, 240);
      if (m === null) return { ok: false, error: 'minutes needed (0-240)' };
      const f = m ? { until: Date.now() + m * 60e3, what: s(b.what, 60) || 'focus', by } : null;
      await h.setJSON('focus', f);
      return { ok: true, focus: f };
    }
    case 'coins': {
      // Idea 32: a win in the house pays DayTrack coins, once per id
      const id = s(b.id, 60), n = int(b.n, 1, 200);
      if (!id || !n) return { ok: false, error: 'id and n (1-200) needed' };
      const list = (await get('coins')) || [];
      if (!list.some(c => c.id === id)) await h.setJSON('coins', [...list, { id, n, why: s(b.why, 80) || 'A win in the house', at: Date.now() }].slice(-300));
      return { ok: true };
    }
    case 'first': {
      // Idea 33: a house first becomes a DayTrack achievement with a title
      const id = s(b.id, 40), text = s(b.text, 80);
      if (!id || !/^[\w-]+$/.test(id) || !text) return { ok: false, error: 'id (letters, digits, _ and -) and text needed' };
      const list = (await get('firsts')) || [];
      if (!list.some(f => f.id === id)) await h.setJSON('firsts', [...list, { id, text, title: s(b.title, 30), at: Date.now() }].slice(-200));
      return { ok: true };
    }
    case 'goals': {
      // Idea 34: her goals for the week
      const goals = (Array.isArray(b.goals) ? b.goals : []).slice(0, 8).map((g, i) => ({ id: s(g.id, 40) || 'g' + i, text: s(g.text, 80) || '', total: int(g.total, 1, 100) || 1, done: int(g.done, 0, 100) || 0 })).filter(g => g.text);
      await h.setJSON('herGoals', { week: /^\d{4}-\d{2}-\d{2}$/.test(b.week || '') ? b.week : weekOf(today), goals, at: Date.now() });
      return { ok: true };
    }
    case 'needs': {
      // Idea 39: her Sims-style needs, 0-100
      const n = { energy: int(b.energy, 0, 100), fun: int(b.fun, 0, 100), company: int(b.company, 0, 100), at: Date.now() };
      if ([n.energy, n.fun, n.company].includes(null)) return { ok: false, error: 'energy, fun and company needed (0-100)' };
      await h.setJSON('needs', n);
      return { ok: true };
    }
    case 'schedule': {
      // Idea 40: her weekly routine
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30).map(x => ({ id: s(x.id, 40), day: int(x.day, 0, 6), time: hm(x.time), what: s(x.what, 60), minutes: int(x.minutes, 5, 600) || 60 }))
        .filter(x => x.id && x.day !== null && x.time && x.what);
      await h.setJSON('schedule', items);
      return { ok: true };
    }
    case 'app': {
      // The phone's side of the shared state (it posts this when something changes)
      const d = x => /^\d{4}-\d{2}-\d{2}$/.test(x || '') ? x : null, o = x => x && typeof x === 'object' ? x : null;
      const st = o(b.stats), lu = o(b.levelUp), boss = o(b.boss), pet = o(b.pet), sl = o(b.sleep), my = o(b.myGoals), t = o(b.today);
      await h.setJSON('app', {
        levelUp: lu && int(lu.level, 1, 999) ? { level: int(lu.level, 1, 999), at: int(lu.at, 0, 9e15) || 0 } : null,
        boss: boss && s(boss.name, 40) && ['on', 'won', 'escaped'].includes(boss.state) ? { name: s(boss.name, 40), state: boss.state, until: int(boss.until, 0, 9e15) || 0, date: today } : null,
        mood: int(b.mood, 1, 5), moodDate: today, walking: o(b.walking) && int(b.walking.since, 0, 9e15) ? { since: int(b.walking.since, 0, 9e15) } : null,
        stats: st && Object.fromEntries(Object.entries(st).filter(([k]) => /^[a-z]{1,20}$/.test(k)).slice(0, 20).map(([k, v]) => [k, int(v, 1, 999) || 1])),
        pet: pet && ['fox', 'cat', 'dragon', 'owl'].includes(pet.kind) ? { kind: pet.kind, name: s(pet.name, 20) || pet.kind } : null,
        sleep: { bed: hm(sl && sl.bed), wake: hm(sl && sl.wake) },
        myGoals: my ? { week: d(my.week) || weekOf(today), done: int(my.done, 0, 100) || 0, total: int(my.total, 0, 100) || 0 } : null,
        today: t ? { date: today, done: int(t.done, 0, 999) || 0, total: int(t.total, 0, 999) || 0, chatMinutes: int(t.chatMinutes, 0, 1440) || 0 } : null,
        joins: (Array.isArray(b.joins) ? b.joins : []).slice(0, 20).map(j => ({ id: s(j.id, 40), date: d(j.date) })).filter(j => j.id && j.date), at: Date.now() });
      return { ok: true };
    }
  }
  return null;
}
