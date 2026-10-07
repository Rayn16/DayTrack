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

http.close();
console.log('All API checks passed');
process.exit(0);
