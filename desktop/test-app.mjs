// Self-check for the app's spoken-task parser and prayer times: `node test-app.mjs` in desktop/
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.TZ = 'Asia/Riyadh';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const grab = name => html.match(new RegExp(`(?:const ${name}=.*|function ${name}\\([\\s\\S]*?\\n})`))[0];
const src = ['pad', 'toDateStr'].map(n => html.match(new RegExp(`function ${n}\\(.*`))[0])
  .concat(['NUMS', 'WDAYS', 'parseSpokenTask', 'prayerTimes'].map(grab)).join('\n');
const {parseSpokenTask, prayerTimes} = new Function(src + '\nreturn {parseSpokenTask, prayerTimes};')();

const now = new Date('2026-10-07T09:00:00'); // a Wednesday
const p = t => parseSpokenTask(t, now);
assert.deepEqual(p('dentist Tuesday at 3'), {name: 'Dentist', date: '2026-10-13', time: '15:00'});
assert.deepEqual(p('remind me to call mom tomorrow at 9am'), {name: 'Call mom', date: '2026-10-08', time: '09:00'});
assert.deepEqual(p('gym at 6:30 pm'), {name: 'Gym', date: null, time: '18:30'});
assert.deepEqual(p('buy 2 apples'), {name: 'Buy 2 apples', date: null, time: null});
assert.deepEqual(p('pay rent on the 15th'), {name: 'Pay rent', date: '2026-10-15', time: null});
assert.deepEqual(p('exam October 20th at 10'), {name: 'Exam', date: '2026-10-20', time: '10:00'});
assert.deepEqual(p('meeting in 2 days at 14:00'), {name: 'Meeting', date: '2026-10-09', time: '14:00'});
assert.deepEqual(p('dinner with Sara tonight at 8'), {name: 'Dinner with Sara', date: null, time: '20:00'});
assert.deepEqual(p('next wednesday haircut'), {name: 'Haircut', date: '2026-10-14', time: null});
assert.deepEqual(p('study in the morning at 7'), {name: 'Study', date: null, time: '07:00'});

// Umm al-Qura times for Riyadh, checked against the adhan library (within a minute)
assert.deepEqual(prayerTimes('2026-10-07', 24.7, 46.7), {Fajr: '04:30', Sunrise: '05:48', Dhuhr: '11:41', Asr: '15:03', Maghrib: '17:34', Isha: '19:04'});
assert.equal(prayerTimes('2027-02-20', 24.7, 46.7).Isha, '19:50'); // Ramadan: Isha two hours after Maghrib
// Levels: what a task trains, and the level curve (levels.js)
const lv = new Function(fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nreturn {heroDetect, heroLvl, heroAt};')();
assert.deepEqual(lv.heroDetect('Push-ups'), {chest: 1, arms: 1, core: .3});
assert.deepEqual(lv.heroDetect('Read Quran'), {faith: 1, discipline: .3});
assert.deepEqual(lv.heroDetect('Read a book'), {intellect: 1, focus: .3});
assert.deepEqual(lv.heroDetect('Buy a lamp'), {});
assert.equal(lv.heroLvl(0, 50), 1); assert.equal(lv.heroLvl(99, 50), 1); assert.equal(lv.heroLvl(100, 50), 2);
for (const L of [2, 7, 30]) { assert.equal(lv.heroLvl(lv.heroAt(L, 50), 50), L); assert.equal(lv.heroLvl(lv.heroAt(L, 50) - 1, 50), L - 1); }
// Buffs: a 7-day streak and 7 h sleep raise XP, short sleep and an overdue task lower it
const bf = new Function('toDateStr', 'completedDays', 'sleepLog', 'moods', 'tasks', 'sleepHours', fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nheroP.bossCfg={on:false,seed:"t"};return {heroBuffs, heroMult, heroP, heroTaskAwards, heroDBoss, heroWBoss, heroNBoss, heroEvent, isTodayTask:typeof isTodayTask};');
const toDateStr = new Function(html.match(/function pad\(.*/)[0] + html.match(/function toDateStr\(.*/)[0] + 'return toDateStr;')();
const days7 = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'];
const hrs = s => { const m = t => +t.slice(0, 2) * 60 + +t.slice(3); return ((m(s.wake) - m(s.bed) + 1440) % 1440) / 60; };
let b = bf(toDateStr, days7, {'2026-10-08': {bed: '23:00', wake: '07:30'}}, {}, [], hrs);
assert.deepEqual(b.heroBuffs('2026-10-08').map(x => x.name), ['Blazing', 'Well rested']);
assert.equal(b.heroMult('2026-10-08'), 1.3);
b = bf(toDateStr, [], {'2026-10-08': {bed: '02:00', wake: '06:30'}}, {}, [{recurring: false, date: '2026-10-06', done: []}], hrs);
assert.deepEqual(b.heroBuffs('2026-10-08').map(x => x.name), ['Tired', 'Early bird', 'Overdue']);
assert.equal(b.heroMult('2026-10-08'), 0.9);
// Rare events land on about 12% of days
assert.ok(b.heroEvent('2026-10-08') === null || b.heroEvent('2026-10-08').id);
const ev = Array.from({length: 1000}, (_, i) => b.heroEvent(toDateStr(new Date(2026, 0, 1 + i)))).filter(Boolean).length;
assert.ok(ev > 80 && ev < 170, 'events ' + ev);
// Daily boss: always inside the hours he picked, the same on every device, 30 minutes to beat it
b.heroP.bossCfg = {on: true, from: '10:00', to: '22:00', seed: 'abc', onAt: 1};
for (let i = 0; i < 200; i++) {
  const d = toDateStr(new Date(2026, 0, 1 + i)), x = b.heroDBoss(d), t = new Date(x.at), m = t.getHours() * 60 + t.getMinutes();
  assert.ok(m >= 600 && m <= 1290, d + ' ' + m); assert.equal(x.until - x.at, (x.elite ? 20 : 30) * 60000); assert.equal(b.heroDBoss(d).at, x.at);
}
// About one in seven is an elite; world bosses only on Fridays with three strikes; nightmares only after 10 PM inside his hours
const el = Array.from({length: 400}, (_, i) => b.heroDBoss(toDateStr(new Date(2026, 0, 1 + i)))).filter(x => x.elite).length;
assert.ok(el > 30 && el < 95, 'elites ' + el);
for (let i = 0; i < 60; i++) {
  const d = toDateStr(new Date(2026, 0, 1 + i)), w = b.heroWBoss(d), fri = new Date(d + 'T12:00:00').getDay() === 5;
  assert.equal(!!w, fri, d); if (w) { assert.equal(w.tasks.length, 3); assert.equal(new Set(w.tasks).size, 3); assert.equal(w.until - w.at, 3600e3); assert.equal(new Date(w.at).getHours(), 21); }
}
assert.equal(Array.from({length: 100}, (_, i) => b.heroNBoss(toDateStr(new Date(2026, 0, 1 + i)))).filter(Boolean).length, 0); // hours end at 10 PM: no room
b.heroP.bossCfg.to = '23:59';
const nb = Array.from({length: 300}, (_, i) => b.heroNBoss(toDateStr(new Date(2026, 0, 1 + i)))).filter(Boolean);
assert.ok(nb.length > 20 && nb.length < 75, 'nightmares ' + nb.length);
nb.forEach(x => { const t = new Date(x.at), m = t.getHours() * 60 + t.getMinutes(); assert.ok(m >= 1320 && m + 30 <= 1439, 'night ' + m); });
b.heroP.bossCfg.to = '22:00';
b.heroP.bossCfg.onAt = new Date(2026, 5, 1).getTime(); assert.equal(b.heroDBoss('2026-05-20'), null); // none before they were switched on
b.heroP.bossCfg.on = false; assert.equal(b.heroDBoss('2026-10-08'), null);
// Hardcore doubles task XP; a mini boss pays more the longer it waited
const isT = (t, d, dow) => t.recurring ? (t.days.length === 0 || t.days.includes(dow)) : true;
const hb = new Function('toDateStr', 'completedDays', 'sleepLog', 'moods', 'tasks', 'sleepHours', 'isTodayTask', fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nheroP.bossCfg={on:false};return {heroTaskAwards};')(toDateStr, [], {}, {}, [], hrs, isT);
const t0 = {name: 'Push-ups', recurring: true, days: [], done: ['2026-01-05'], subtasks: [], hard: true, hardFrom: '2026-01-01', createdAt: '2026-01-01'};
const aw = hb.heroTaskAwards(t0);
assert.equal(aw.find(a => a.k === 'task').xp, 40);
assert.ok(aw.filter(a => a.k === 'hard').length > 200 && aw.filter(a => a.k === 'hard').every(a => a.xp === -20 && a.d !== '2026-01-05'));
const mb = hb.heroTaskAwards({name: 'Fix the car', recurring: false, days: [], done: ['2026-01-11'], subtasks: [], boss: true, createdAt: '2026-01-01'});
assert.equal(mb.find(a => a.k === 'mboss').xp, 140); // 20 × 2 + 10 days × 10
console.log('All app checks passed');
// HP: a daily task missed every day drains 10 HP a day; at 0 you fall (−50% XP) until 3 tasks are done in a day
{
  const back = n => toDateStr(new Date(Date.now() - n * 864e5)), tod = back(0);
  const hpT = [{id: 'p', name: 'Pray', recurring: true, days: [], done: [], subtasks: [], createdAt: back(30)}];
  const hh = new Function('toDateStr', 'completedDays', 'sleepLog', 'moods', 'tasks', 'sleepHours', 'isTodayTask', fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nheroP.bossCfg={on:false};return {heroHP, heroBuffs, heroP};')(toDateStr, [], {}, {}, hpT, hrs, isT);
  hh.heroP.hpOn = back(12);
  let x = hh.heroHP(); assert.equal(x.down, true); assert.equal(x.hp, 0); assert.ok(x.fall[back(1)] && x.fall[tod]);
  assert.ok(hh.heroBuffs(back(1)).some(b => b.name === 'Fallen')); assert.ok(!hh.heroBuffs(back(5)).some(b => b.name === 'Fallen'));
  ['a', 'b', 'c'].forEach(id => hpT.push({id, name: id, recurring: false, days: [], date: tod, done: [tod], subtasks: [], createdAt: tod}));
  x = hh.heroHP(); assert.equal(x.down, false); assert.equal(x.hp, 50); assert.ok(!x.fall[tod]);
  hh.heroP.hpOn = back(4); hpT.splice(1); x = hh.heroHP(); assert.equal(x.hp, 60); // 4 missed days
}
console.log('Round 5 checks passed');

// Walks: distance, auto-pause, splits, climb, same-route
{
  const wk = new Function(fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nreturn {heroWalkStats, heroSameRoute};')();
  const pts = []; let lat = 24.7, t = 0;
  for (let i = 0; i < 360; i++) { lat += 7 / 111195; t += 5; pts.push([lat, 46.7, 600 + (i < 180 ? i * .2 : 36), t]); }   // 1.4 m/s for 30 min, climbing 36 m
  for (let i = 0; i < 12; i++) { t += 5; pts.push([lat, 46.7, 636, t]); }                                         // a 1-minute stop
  const s = wk.heroWalkStats(pts);
  assert(Math.abs(s.m - 2513) < 15, 'walk distance ' + s.m);
  assert(Math.abs(s.mov - 1795) < 10, 'auto-pause ignores the stop: ' + s.mov);
  assert(s.sp.length === 2 && Math.abs(s.sp[0] - 714) < 5, 'splits ' + s.sp);
  assert(s.climb >= 30 && s.climb <= 36, 'climb ' + s.climb);
  const a = {start: [24.7, 46.7], end: [24.72, 46.7], m: 2500}, b = {start: [24.7005, 46.7], end: [24.7202, 46.7], m: 2600}, c = {...b, m: 4000};
  assert(wk.heroSameRoute(a, b) && !wk.heroSameRoute(a, c), 'same route');
  console.log('Walk checks passed');
}

// Round 6: crits, drops and boosts only from the day it arrived, stay the same when worked out again; hardcore runs keep past XP
{
  const toDateStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const back = n => toDateStr(new Date(Date.now() - n * 864e5)), tod = back(0);
  const T = [{id: 'g', name: 'Gym workout', recurring: true, days: [], done: Array.from({length: 60}, (_, i) => back(i)), subtasks: []}];
  const r6 = new Function('toDateStr', 'completedDays', 'sleepLog', 'moods', 'tasks', 'isTodayTask', 'savedSessions', 'goals', fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8')
    + '\nheroP.bossCfg={on:false,seed:"t"};return {heroTaskAwards, heroDrops, heroP, heroHC, heroOmen, heroBoost:()=>heroBoostMemo={}};')(toDateStr, [], {}, {}, T, () => true, [], []);
  const sum = () => { r6.heroBoost(); return r6.heroTaskAwards(T[0]).reduce((n, a) => n + a.xp, 0); };
  const base = sum(); assert.equal(base, 60 * 20, 'no crits before round 6');
  assert.equal(r6.heroDrops().length, 0, 'no loot before round 6');
  r6.heroP.r6 = back(30); const withCrit = sum(); assert.equal(withCrit, sum(), 'crits are the same every time');
  assert.ok(withCrit >= base && (withCrit - base) % 40 === 0, 'a crit adds 2 × 20 XP');
  const drops = r6.heroDrops(); assert.ok(drops.every(x => x.d >= back(30)) && drops.length > 0 && drops.length < 31, 'drops ' + drops.length);
  const day = d => (r6.heroBoost(), r6.heroTaskAwards(T[0]).find(a => a.d === d)), c = x => x.what.includes('critical') ? 3 : 1;
  r6.heroP.origin = {id: 'dwarf', d: tod}; const t0 = day(tod), y0 = day(back(1));
  assert.equal(t0.xp, Math.round(20 * 1.05 * c(t0)), 'origin boosts today'); assert.equal(y0.xp, 20 * c(y0), 'but not the days before it');
  r6.heroP.hc = {runs: [{from: back(10), to: back(5)}, {from: back(2)}]};
  assert.ok(r6.heroHC(back(7)) && !r6.heroHC(back(4)) && r6.heroHC(tod), 'hardcore runs');
  console.log('Round 6 checks passed');
}
