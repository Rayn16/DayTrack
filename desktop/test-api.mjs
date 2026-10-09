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

// The phone's kit (persona + Claude key, so "Hey Gwen" works with the PC off): Gwen key only, and only once there's a Claude key
assert.equal((await call('/.netlify/functions/gwen', {key: 'wrong', kit: true})).status, 401);
assert.equal((await call('/.netlify/functions/gwen', {key: 'k', kit: true})).status, 404);
process.env.ANTHROPIC_API_KEY = 'sk-test';
const kit = await call('/.netlify/functions/gwen', {key: 'k', kit: true});
delete process.env.ANTHROPIC_API_KEY;
assert.equal(kit.apiKey, 'sk-test');
assert.ok(kit.system.includes('Gwen'));

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

// 10-09 round
{
  // Idea 1: his mount and forged weapon reach the house
  await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true, hero: {mount: 'wolf', weapon: {id: 'blade', name: 'Blade of Dawn'}}});
  assert.deepEqual((await call('/api/house?key=k')).hero, {mount: 'wolf', weapon: {id: 'blade', name: 'Blade of Dawn'}, stats: null, pet: null});
  await call('/.netlify/functions/save-reminder', {subscription: sub, tasks: [task], completedDays: [today], tz, gwen: true, hero: {mount: 'unicorn', weapon: {id: 'x"y'}}});
  assert.deepEqual((await call('/api/house?key=k')).hero, {mount: null, weapon: null, stats: null, pet: null}, 'only known mounts, clean ids');
  // Idea 3: a letter for a finished month, once (no Claude key here, so her fallback letter)
  assert.equal((await call('/api/house', {key: 'k', event: 'month', month: today.slice(0, 7), lines: []})).status, 400, 'not the month that is still going');
  const lm = new Date(); lm.setDate(1); lm.setMonth(lm.getMonth() - 1);
  const month = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
  const l1 = (await call('/api/house', {key: 'k', event: 'month', month, lines: ['He finished 80 tasks on 25 days.']})).letter;
  assert.ok(l1 && l1.id === 'l-' + month && l1.text.startsWith('Dear Rayan') && l1.text.includes('80 tasks'), JSON.stringify(l1));
  assert.equal((await call('/api/house', {key: 'k', event: 'month', month, lines: ['other']})).letter.at, l1.at, 'written once');
  assert.equal((await call('/api/house?key=k')).letter.id, l1.id);
  assert.equal((await call('/api/house', {key: 'k', event: 'letter', id: l1.id})).ok, true);
  assert.ok((await call('/api/house?key=k')).letter.read);
  // Idea 21: the app in front, once a minute, not while a game is open
  await call('/api/pc', {key: 'k', action: 'report', game: null, app: 'Code.exe'});
  await call('/api/pc', {key: 'k', action: 'report', game: null, app: 'Code.exe'}); // same minute
  await call('/api/pc', {key: 'k', action: 'report', game: 'The Isle', app: 'TheIsle.exe'});
  const apps = (await call('/api/pc?key=k&apps=1')).days;
  assert.deepEqual(apps[Object.keys(apps).pop()], {'Code.exe': 1});
  // Idea 22: tomorrow's tasks for the bedtime nudge, timed first
  await call('/.netlify/functions/save-reminder', {subscription: sub, tz, gwen: true, completedDays: [], tasks: [
    {id: 'r1', name: 'Gym', recurring: true, days: [], done: [], reminder: {type: 'time', time: '18:00'}},
    {id: 'r2', name: 'Read', recurring: true, days: [], done: []},
    {id: 'o1', name: 'Dentist', recurring: false, days: [], done: [], date: '2099-01-01', reminder: '9:30'}]});
  const tm = await call('/api/pc?key=k&tomorrow=1');
  assert.match(tm.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(tm.tomorrow, [{name: 'Gym', time: '18:00'}, {name: 'Read', time: null}], 'far-off one-off tasks left out');
  // Idea 24: send to phone, a file that downloads by its id alone
  const txt = 'data:text/plain;base64,' + Buffer.from('hello from the PC').toString('base64');
  const sent = await call('/api/pc', {key: 'k', action: 'send', file: txt, name: 'notes "v2".txt'});
  assert.equal(sent.ok, true); assert.match(sent.id, /^[a-f0-9]{32}$/);
  const dl = await fetch(url + '/dt/api/pc?file=' + sent.id);
  assert.equal(dl.status, 200); assert.equal(await dl.text(), 'hello from the PC');
  assert.match(dl.headers.get('content-disposition'), /filename="notes v2.txt"|filename="notes _v2_.txt"/);
  assert.equal((await fetch(url + '/api/pc?file=' + 'f'.repeat(32))).status, 404);
  assert.equal((await call('/api/pc', {key: 'k', action: 'send'})).status, 400);
  const msgs = (await call('/.netlify/functions/gwen', {key: 'k', inbox: 'abc12345'})).messages;
  const fm = msgs.find(m => m.file);
  assert.ok(fm && fm.file.id === sent.id && fm.file.name === 'notes _v2_.txt' && fm.text === '📎 notes _v2_.txt', JSON.stringify(fm));
  assert.equal((await call('/api/pc', {key: 'k', action: 'send', text: 'look at this', image: png})).ok, true);
  assert.ok(!(await call('/api/backup?key=k'))['daytrack-house']['file-' + sent.id], 'sent files stay out of backups');
  console.log('10-09 round checks passed');
}

// 10-09 second round (ideas 31-51)
{
  // 31: the story, a clue from each side
  let st = (await call('/api/house?key=k')).story;
  assert.equal(st.chapter, 1); assert.equal(st.clues.length, 3); assert.ok(st.clues.every(c => !c.found && c.hint));
  const [ch, cp, cf] = st.clues;
  assert.equal((await call('/api/house', {key: 'k', event: 'clue', id: 'nope'})).status, 400);
  assert.equal((await call('/api/house', {key: 'k', event: 'clue', id: ch.id})).ok, true);
  assert.equal((await call('/api/pc', {key: 'k', action: 'clue', id: cp.id})).ok, true);
  st = (await call('/api/house', {key: 'k', event: 'clue', id: cf.id, by: 'phone'})).story;
  assert.ok(st.solved && st.chapter === 1, 'next chapter waits for next week');
  // 32, 33: coins once per id, firsts
  await call('/api/house', {key: 'k', event: 'coins', id: 'chess-1', n: 50, why: 'Beat Gwen at chess'});
  await call('/api/house', {key: 'k', event: 'coins', id: 'chess-1', n: 50});
  assert.equal((await call('/api/house', {key: 'k', event: 'coins', id: 'x', n: 0})).status, 400);
  assert.equal((await call('/api/house', {key: 'k', event: 'first', id: 'first boat', text: 'x'})).status, 400);
  await call('/api/house', {key: 'k', event: 'first', id: 'first_boat', text: 'First boat trip', title: 'Captain'});
  // 34, 39, 40: her goals, needs, schedule
  await call('/api/house', {key: 'k', event: 'goals', goals: [{id: 'paint', text: 'Paint 2 pictures', done: 2, total: 2}]});
  await call('/api/house', {key: 'k', event: 'needs', energy: 80, fun: 140, company: 20});
  assert.equal((await call('/api/house', {key: 'k', event: 'needs', energy: 1})).status, 400);
  await call('/api/house', {key: 'k', event: 'schedule', items: [{id: 'paint', day: 1, time: '17:00', what: 'Painting', minutes: 60}, {id: 'bad', day: 9, time: 'x', what: 'y'}]});
  // The phone's side
  await call('/api/house', {key: 'k', event: 'app', by: 'phone', levelUp: {level: 12, at: 5}, boss: {name: 'Doomscroll Dragon', state: 'on', until: 9}, mood: null,
    walking: {since: Date.now()}, stats: {strength: 4, intellect: 7}, pet: {kind: 'fox', name: 'Kitsu'}, sleep: {bed: '23:30', wake: 'bad'},
    myGoals: {done: 3, total: 3}, today: {done: 2, total: 5, chatMinutes: 14}, joins: [{id: 'paint', date: '2099-01-05'}]});
  // 45: focus from the PC, everywhere
  assert.equal((await call('/api/pc', {key: 'k', action: 'focus', minutes: 25, what: 'Math'})).ok, true);
  // 50: a cleaning task he just ticked
  await call('/.netlify/functions/save-reminder', {subscription: sub, tz, gwen: true, completedDays: [], tasks: [{id: 'c1', name: 'Wash the dishes', recurring: true, days: [], done: [today]}]});
  h = await call('/api/house?key=k');
  assert.deepEqual(h.coins.map(c => [c.id, c.n]), [['chess-1', 50]]);
  assert.deepEqual(h.firsts.map(f => [f.id, f.title]), [['first_boat', 'Captain']]);
  assert.equal(h.herGoals.rewarded, true);
  assert.deepEqual([h.needs.energy, h.needs.fun, h.needs.company], [80, 100, 20]);
  assert.deepEqual(h.schedule.map(x => x.id), ['paint']);
  assert.equal(h.levelUp.level, 12); assert.equal(h.boss.state, 'on'); assert.equal(h.mood, null); assert.ok(h.walking);
  assert.deepEqual(h.hero.stats, {strength: 4, intellect: 7}); assert.equal(h.hero.pet.name, 'Kitsu');
  assert.deepEqual(h.sleep, {bed: '23:30', wake: null});
  assert.deepEqual(h.today, {date: today, done: 2, total: 5, chatMinutes: 14}); assert.equal(h.joins.length, 1);
  assert.equal(h.focus.by, 'pc'); assert.equal(h.focus.what, 'Math');
  assert.deepEqual(h.chores.map(c => c.kind), ['dishes']);
  await call('/api/house', {key: 'k', event: 'focus', minutes: 0});
  const p = await call('/api/pc?key=k');
  assert.equal(p.focus, null); assert.ok(p.story && 'prayers' in p && p.away.where);
  // 36: at the PC her texts go to the desktop instead of the phone; held while gaming
  await call('/api/outbox?auth=abc12345');
  assert.deepEqual((await call('/api/pc?key=k&inbox=1')).messages, []);
  await call('/api/pc', {key: 'k', action: 'report', app: 'Code.exe', idle: 3, game: null});
  assert.equal((await call('/api/pc?key=k')).away.where, 'pc');
  await call('/api/pc', {key: 'k', action: 'send', text: 'held for the desktop'});
  assert.deepEqual(await (await fetch(url + '/api/outbox?auth=abc12345')).json(), [], 'no phone buzz at the PC');
  await call('/api/pc', {key: 'k', action: 'report', app: 'TheIsle.exe', game: 'The Isle'});
  await call('/api/pc', {key: 'k', action: 'send', text: 'while gaming'});
  assert.deepEqual((await call('/api/pc?key=k&inbox=1')).messages, [], 'waits while gaming');
  await call('/api/pc', {key: 'k', action: 'report', app: 'Code.exe', game: null});
  assert.deepEqual((await call('/api/pc?key=k&inbox=1')).messages.map(m => m.text), ['held for the desktop', 'while gaming']);
  assert.deepEqual((await call('/api/pc?key=k&inbox=1')).messages, [], 'taken once');
  await call('/api/pc', {key: 'k', action: 'report', app: 'Code.exe', idle: 900, game: null});
  await call('/api/pc', {key: 'k', action: 'send', text: 'away from the PC'});
  assert.equal((await (await fetch(url + '/api/outbox?auth=abc12345')).json()).length, 1, 'idle: the phone gets it');
  // 38: status page
  const s = await call('/api/status?key=k');
  assert.deepEqual(s.parts.map(x => x.id), ['airi', 'voice', 'bridge', 'house', 'daytrack', 'tailscale']);
  assert.equal((await call('/api/status', {key: 'k', start: 'house'})).status, 400);
  assert.equal((await call('/api/status?key=no')).status, 401);
  // 37: one settings page over both files
  fs.mkdirSync(path.join(dir, 'Gwen', 'shared-settings'));
  fs.writeFileSync(path.join(dir, 'Gwen', 'shared-settings', 'desktop.json'), JSON.stringify({title: 'Desktop Gwen', items: [{key: 'voice', label: 'Voice', type: 'choice', options: ['bubble', 'velvet'], value: 'bubble'}, {key: 'quiet', label: 'Quiet', type: 'toggle', value: false}]}));
  assert.deepEqual((await call('/api/settings?key=k')).apps.map(a => a.app), ['desktop']);
  assert.equal((await call('/api/settings', {key: 'k', app: 'desktop', item: 'voice', value: 'loud'})).status, 400);
  assert.equal((await call('/api/settings', {key: 'k', app: 'house', item: 'voice', value: 'velvet'})).status, 404);
  assert.equal((await call('/api/settings', {key: 'k', app: 'desktop', item: 'voice', value: 'velvet'})).ok, true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'Gwen', 'shared-settings', 'desktop.json'), 'utf8')).items[0].value, 'velvet');
  console.log('10-09 second round checks passed');
}

http.close();
console.log('All API checks passed');
process.exit(0);
