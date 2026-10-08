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
const bf = new Function('toDateStr', 'completedDays', 'sleepLog', 'moods', 'tasks', 'sleepHours', fs.readFileSync(new URL('../levels.js', import.meta.url), 'utf8') + '\nreturn {heroBuffs, heroMult};');
const toDateStr = new Function(html.match(/function pad\(.*/)[0] + html.match(/function toDateStr\(.*/)[0] + 'return toDateStr;')();
const days7 = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'];
const hrs = s => { const m = t => +t.slice(0, 2) * 60 + +t.slice(3); return ((m(s.wake) - m(s.bed) + 1440) % 1440) / 60; };
let b = bf(toDateStr, days7, {'2026-10-08': {bed: '23:00', wake: '07:30'}}, {}, [], hrs);
assert.deepEqual(b.heroBuffs('2026-10-08').map(x => x.name), ['Blazing', 'Well rested']);
assert.equal(b.heroMult('2026-10-08'), 1.3);
b = bf(toDateStr, [], {'2026-10-08': {bed: '02:00', wake: '06:30'}}, {}, [{recurring: false, date: '2026-10-06', done: []}], hrs);
assert.deepEqual(b.heroBuffs('2026-10-08').map(x => x.name), ['Tired', 'Early bird', 'Overdue']);
assert.equal(b.heroMult('2026-10-08'), 0.9);
console.log('All app checks passed');
