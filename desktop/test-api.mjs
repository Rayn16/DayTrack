// Self-check for the house / PC / backup endpoints and parcels: `npm run web && node test-api.mjs` in desktop/
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-')), keys = path.join(dir, 'Gwen', 'daytrack.json');
fs.mkdirSync(path.dirname(keys));
fs.writeFileSync(keys, JSON.stringify({key: 'k', gwenBorn: '2026-09-30'}));
const server = createRequire(import.meta.url)('./server.js');
const {server: http} = await server.start({dataDir: path.join(dir, 'data'), keysFile: keys, fnDir: path.resolve('server/functions')});
const url = 'http://127.0.0.1:5053';
const call = (p, body) => fetch(url + p, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {}).then(async r => ({status: r.status, ...(await r.json())}));
const d = new Date(), today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

assert.equal((await call('/api/house?key=wrong')).status, 401);
let h = await call('/dt/api/house?key=k');
assert.deepEqual(h.parcels, []);
assert.equal(h.born, '2026-09-30');
assert.ok(h.milestone && [30, 100, 365].includes(h.milestone.days));

// The phone saves its tasks: everything done today → a parcel at the house
const sub = {endpoint: 'native:abc12345', keys: {auth: 'abc12345'}};
const task = {id: 't1', name: 'Gym', recurring: false, days: [], done: [today]};
assert.equal((await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true,
  prayers: {remind: true, days: {[today]: {Fajr: '04:30'}}}, goals: [{name: 'Learn Japanese', done: 2, total: 5, lastAt: today}], sleep: {[today]: {bed: '23:30', wake: '07:00'}}})).status, 200);
h = await call('/api/house?key=k');
assert.equal(h.parcels.length, 1);
assert.equal(h.parcels[0].id, 'p-' + today);
assert.match(h.parcels[0].reason, /all 1 of his tasks/);
// Unticking it again sends the waiting parcel back
await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [{...task, done: []}], completedDays: [], tz, gwen: true});
assert.equal((await call('/api/house?key=k')).parcels.length, 0);
await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true});
assert.equal((await call('/api/house', {key: 'k', event: 'delivered', id: 'p-' + today})).ok, true);
assert.equal((await call('/api/house?key=k')).parcels[0].status, 'delivered');
assert.equal((await call('/api/house', {key: 'k', event: 'opened', id: 'p-' + today, text: 'A little cactus!'})).ok, true);
assert.equal((await call('/api/house?key=k')).parcels.length, 0);

// Her texts land in her chat inbox and the phone's outbox, with the photo
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
assert.equal((await call('/api/house', {key: 'k', event: 'text', text: 'Yasuo stole my spot on the couch again', image: png})).ok, true);
for (let i = 0; i < 3; i++) await call('/api/house', {key: 'k', event: 'text', text: 'hi ' + i});
assert.equal((await call('/api/house', {key: 'k', event: 'text', text: 'one too many'})).error, 'limit');
const box = await fetch(url + '/.netlify/functions/outbox?auth=abc12345').then(r => r.json());
assert.ok(box.some(m => m.body === 'A little cactus!' && m.gwen));
assert.ok(box.some(m => m.body.startsWith('Yasuo') && m.image === png));
const inbox = await call('/.netlify/functions/gwen', {key: 'k', inbox: 'abc12345'});
assert.ok(inbox.messages.some(m => m.image === png));

// Postcards: saved for the gallery, full picture served as an image
const pc = await call('/api/house', {key: 'k', event: 'postcard', title: 'Sunset painting', image: png});
assert.ok(pc.id);
const cards = await call('/api/house?key=k&postcards=1');
assert.equal(cards.postcards[0].title, 'Sunset painting');
const img = await fetch(`${url}/api/house?key=k&postcard=${pc.id}`);
assert.equal(img.headers.get('content-type'), 'image/png');

// Prayer reminder at its time
const now = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true, prayers: {remind: true, days: {[today]: {Asr: now}}}});
await fetch(url + '/.netlify/functions/check-reminders', {method: 'POST'});
assert.ok((await fetch(url + '/.netlify/functions/outbox?auth=abc12345').then(r => r.json())).some(m => m.title === '🕌 Prayer time' && m.body.includes('Asr')));

// PC status, report, and things only DayTrack.exe can do
let st = await call('/api/pc?key=k');
assert.equal(st.pc, true);
assert.equal(st.gwen, false);
await call('/api/pc', {key: 'k', action: 'report', game: 'The Isle', airi: true});
st = await call('/api/pc?key=k');
assert.equal(st.game, 'The Isle');
assert.equal(st.airi, true);
assert.equal((await call('/api/pc', {key: 'k', action: 'start'})).status, 404); // no Start-Gwen.bat here
assert.equal((await call('/api/pc', {key: 'k', action: 'update'})).status, 501);

// Backup has it all
const b = await fetch(url + '/api/backup?key=k').then(r => r.json());
assert.ok(b['daytrack-house'].parcels && b['daytrack'].abc12345.tasks[0].name === 'Gym');
assert.equal((await fetch(url + '/api/backup')).status, 401);

// Idea 1: what she's doing in the house; one outfit for all three
assert.equal((await call('/api/house', {key: 'k', event: 'now', activity: 'painting', room: 'attic', outfit: 'Cozy', open: true})).ok, true);
h = await call('/api/house?key=k&from=phone');
assert.equal(h.now.activity, 'painting');
assert.equal(h.houseOpen, true);
assert.equal((await call('/api/house', {key: 'k', event: 'outfit', outfit: 'pajamas'})).ok, true);
assert.equal((await call('/api/house?key=k')).outfit.outfit, 'Pajamas');
assert.equal((await call('/api/house', {key: 'k', event: 'outfit', outfit: 'nothing'})).status, 400);

// Idea 2: today's quest, done once by whoever sees it
const qst = (await call('/api/house?key=k')).quest;
assert.equal(qst.date, today);
assert.ok(['phone', 'house', 'pc'].includes(qst.where) && qst.text && qst.kind);
assert.equal((await call('/api/house', {key: 'k', event: 'quest', id: 'q-1999-01-01'})).ok, false);
assert.equal((await call('/api/house', {key: 'k', event: 'quest', id: qst.id, by: 'phone'})).quest.done, true);
assert.equal((await call('/api/house?key=k')).quest.done, true);
const {questFor} = await import(path.resolve('server/lib/house.mjs'));
const wheres = new Set(), kinds = new Set();
for (let i = 0; i < 60; i++) { const q = questFor(new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10)); wheres.add(q.where); kinds.add(q.kind); }
assert.equal(wheres.size, 3);
assert.ok(kinds.size >= 15);

// Idea 3: the week he planned, for the house
await call('/api/house', {key: 'k', event: 'week', start: today, lines: ['Mon: gym at 6', 'Tue: game night']});
assert.deepEqual((await call('/api/house?key=k')).week.lines, ['Mon: gym at 6', 'Tue: game night']);

// Idea 4: the phone peeks, the house sees the request on its next poll and sends a photo
const peekReq = fetch(url + '/api/house?key=k&peek=1');
await new Promise(ok => setTimeout(ok, 300));
const peeks = (await call('/api/house?key=k')).peeks;
assert.equal(peeks.length, 1);
assert.equal((await call('/api/house', {key: 'k', event: 'peek', id: peeks[0].id, image: png, activity: 'reading by the fire'})).ok, true);
const peekRes = await peekReq;
assert.equal(peekRes.status, 200);
assert.equal(peekRes.headers.get('content-type'), 'image/png');
assert.equal(decodeURIComponent(peekRes.headers.get('x-activity')), 'reading by the fire');

// Idea 5: Ramadan and prayer times for the house and desktop
const {ramadan, hijri} = await import(path.resolve('server/lib/house.mjs'));
assert.deepEqual(ramadan('2027-02-20'), {today: true, day: 13});
assert.equal(ramadan('2026-10-08').today, false);
assert.equal(ramadan('2026-10-08').starts, '2027-02-08');
assert.equal(hijri('2027-02-08').m, 9);
h = await call('/api/house?key=k');
assert.equal(typeof h.ramadan.active, 'boolean');
assert.equal(typeof (await call('/api/pc?key=k')).ramadan.active, 'boolean');

// Idea 6: the house's part of the first year
await call('/api/house', {key: 'k', event: 'year', text: 'Our first year', firsts: ['First painting'], images: [png]});
assert.equal((await call('/api/house?key=k&year=1')).year.firsts[0], 'First painting');

// Idea 42: "about" without an AI key falls back to the set line
assert.equal((await call('/api/house', {key: 'k', event: 'postcard', about: 'You painted the pond', text: 'Look 💜', image: png})).ok, true);

// Idea 30: the PC's network card for waking it, idea 3: game nights from desktop reports
assert.ok('mac' in (await call('/api/pc?key=k')));
assert.equal(typeof (await call('/api/pc?key=k&games=1')).nights, 'object');

// Idea 35: a shared list, opened by its code only, newest change per item wins
const code = 'ab'.repeat(16);
assert.equal((await call('/.netlify/functions/share?code=' + code)).status, 404);
assert.equal((await call('/s/' + code + '/data', {items: [{id: 'x', text: 'sneaky', at: 1}]})).status, 404); // others can't create one
let sh = await call('/.netlify/functions/share?code=' + code, {name: 'Groceries', items: [{id: 'a', text: 'Milk', at: 10}, {id: 'b', text: 'Eggs', at: 10}]});
assert.equal(sh.items.length, 2);
sh = await call('/dt/s/' + code + '/data', {name: 'Hacked', stop: true, items: [{id: 'a', text: 'Milk', done: true, at: 20}, {id: 'b', text: 'Eggs', at: 5}, {id: 'c', text: 'Bread', at: 21}]});
assert.equal(sh.name, 'Groceries');
assert.deepEqual(sh.items.map(i => [i.id, !!i.done]), [['a', true], ['b', false], ['c', false]]);
sh = await call('/.netlify/functions/share?code=' + code, {items: [{id: 'b', del: true, at: 30}]});
assert.deepEqual(sh.items.filter(i => !i.del).map(i => i.id), ['a', 'c']);
const page = await fetch(url + '/s/' + code);
assert.match(await page.text(), /<title>Shared list<\/title>/);
assert.equal((await fetch(url + '/s/nothex')).status, 404);

// Idea 39: the phone's daily phone time becomes a text from Gwen
const scr = await call('/api/phone', {key: 'k', event: 'screen', minutes: 200, apps: [{name: 'YouTube', minutes: 90}]});
assert.equal(scr.ok, true);
assert.match(scr.text, /YouTube/);
assert.equal((await call('/api/phone', {key: 'x', event: 'screen'})).status, 401);

// Adhkar reminder 25 minutes after Fajr
const fajr = new Date(Date.now() - 25 * 60e3), fajrAt = `${String(fajr.getHours()).padStart(2, '0')}:${String(fajr.getMinutes()).padStart(2, '0')}`;
await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true, adhkar: true, prayers: {remind: false, days: {[today]: {Fajr: fajrAt}}}});
await fetch(url + '/.netlify/functions/check-reminders', {method: 'POST'});
assert.ok((await fetch(url + '/.netlify/functions/outbox?auth=abc12345').then(r => r.json())).some(m => m.title === '🌅 Morning adhkar'));

// App ideas round: a nudge the app scheduled (water when behind) fires on its minute, once
{
  const n = new Date(), at = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  const nudge = {id: 'water15:00', date: today, at, title: '💧 Water', text: 'You\'re at 1 of 8 glasses.'};
  await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, nudges: [nudge, {id: 'bad', date: 'x', at}]});
  await fetch(url + '/.netlify/functions/check-reminders', {method: 'POST'});
  const box = await fetch(url + '/.netlify/functions/outbox?auth=abc12345').then(r => r.json());
  assert.equal(box.filter(m => m.title === '💧 Water').length, 1);
  await fetch(url + '/.netlify/functions/check-reminders', {method: 'POST'});
  assert.ok(!(await fetch(url + '/.netlify/functions/outbox?auth=abc12345').then(r => r.json())).some(m => m.title === '💧 Water'), 'fires once');
}


// Sync: the phone and the PC both change things between syncs; the server merges instead of the newest copy winning
{
  const code = 'c'.repeat(32), push = (base, data) => call('/.netlify/functions/sync', {code, base, data});
  const v0 = {tasks: [{id: 'a', name: 'Water', done: ['2026-10-01']}, {id: 'b', name: 'Old task', done: []}], player: {av: '🧑', walks: []}, updatedAt: 100};
  let r = await push(null, v0); assert.equal(r.data.updatedAt, 100);
  // Phone (base 100): ticks Water today, adds a walk, new photo, deletes "Old task"
  const phone = {tasks: [{id: 'a', name: 'Water', done: ['2026-10-01', '2026-10-08']}], player: {av: '🧑', avImg: 'data:img', walks: [{id: 'w1', m: 3000}]}, updatedAt: 200};
  r = await push(100, phone); assert.equal(r.data.updatedAt, 200);
  // PC (still on base 100): renames Water, adds a task, gets a login bonus
  const pc = {tasks: [{id: 'a', name: 'Water 2L', done: ['2026-10-01']}, {id: 'b', name: 'Old task', done: []}, {id: 'c', name: 'Read', done: []}], player: {av: '🧑', walks: [], bonus: [{d: '2026-10-08', xp: 10}]}, updatedAt: 300};
  r = await push(100, pc);
  const m = r.data;
  assert.equal(m.updatedAt, 301);
  assert.deepEqual(m.tasks.map(t => t.id), ['a', 'c'], 'deleted task stays deleted, new task kept');
  assert.equal(m.tasks[0].name, 'Water 2L');
  assert.deepEqual(m.tasks[0].done, ['2026-10-01', '2026-10-08'], 'tick from the phone kept');
  assert.equal(m.player.avImg, 'data:img');
  assert.equal(m.player.walks.length, 1);
  assert.equal(m.player.bonus.length, 1);
  assert.deepEqual((await call('/.netlify/functions/sync?code=' + code)).tasks.map(t => t.id), ['a', 'c']);
  // An older app with no base: nothing is dropped
  r = await push(undefined, {tasks: [{id: 'z', name: 'Old phone', done: []}], player: {}, updatedAt: 50});
  assert.deepEqual(r.data.tasks.map(t => t.id).sort(), ['a', 'c', 'z']);
  assert.equal(r.data.player.avImg, 'data:img');
  // Same base as what's stored: a plain save, deletions included
  r = await push(r.data.updatedAt, {tasks: [{id: 'a', name: 'Water 2L', done: []}], player: {}, updatedAt: 400});
  assert.deepEqual(r.data.tasks.map(t => t.id), ['a']);
}

http.close();
console.log('All API checks passed');
process.exit(0);
