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
console.log('All app checks passed');
