import { lambda } from '../lib/fn.mjs';
import { keyOk, localNow, questDone, phonePrayers, ramadan, gwenText, shrink, dayAdd, live, whereNow, sharedState, sharedEvent } from '../lib/house.mjs';
import { blobStore } from '../lib/fn.mjs';
import { spawn, execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Gwen's PC from the phone: is it on, is Gwen running, is a game open; start Gwen, lock the PC. Contract: desktop/API.md

// ponytail: a short list of games for when desktop Gwen isn't reporting; her report is the real source
const GAMES = [[/^theisle/i, 'The Isle'], [/^fivem/i, 'FiveM'], [/^gta5/i, 'GTA V'], [/^marvel-win64/i, 'Marvel Rivals'], [/^league of legends/i, 'League of Legends'],
  [/^valorant-win64/i, 'Valorant'], [/^cs2\.exe/i, 'Counter-Strike 2'], [/^fortniteclient/i, 'Fortnite'], [/^robloxplayer/i, 'Roblox']];

const processes = () => new Promise(ok => {
  if (process.platform !== 'win32') return ok([]);
  execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, timeout: 5000 }, (e, out) => ok(e ? [] : out.split('\n').map(l => (l.match(/^"([^"]+)"/) || [])[1]).filter(Boolean)));
});

// Idea 30: the phone wakes the PC with a magic packet to this network card (wired first; not Tailscale, VPNs or virtual ones)
export function wakeMac() {
  // WoL works on the wired card, so it wins even with no IPv4 yet; Wi-Fi only as a last resort while connected
  const wifi = n => /wi-?fi|wireless|wlan/i.test(n), real = x => !x.internal && x.mac && x.mac !== '00:00:00:00:00:00';
  const cards = Object.entries(os.networkInterfaces()).filter(([name, a]) => !/loopback|tailscale|vethernet|virtual|vmware|vpn|hyper-v|bluetooth|wsl/i.test(name)
    && a.some(x => real(x) && !x.address.startsWith('100.') && (!wifi(name) || x.family === 'IPv4')));
  cards.sort(([a], [b]) => wifi(a) - wifi(b));
  return cards.length ? cards[0][1].find(real).mac : null;
}

// Idea 3: which evenings he games, from the reports (hours of the day a game was open), kept 8 weeks
const today = () => localNow(Intl.DateTimeFormat().resolvedOptions().timeZone).date;
async function logGame(game) {
  if (!game) return;
  const store = blobStore('daytrack-house'), log = (await store.get('games', { type: 'json' })) || {}, d = today(), h = new Date().getHours();
  if ((log[d] || []).includes(h)) return;
  log[d] = [...(log[d] || []), h];
  await store.setJSON('games', Object.fromEntries(Object.entries(log).filter(([k]) => k >= new Date(Date.now() - 56 * 864e5).toISOString().slice(0, 10))));
}
// {"Tue": {"from": 20, "to": 23, "weeks": 3}}: weekdays he gamed on at least 2 of the last 4 weeks
export async function gameNights() {
  const log = (await blobStore('daytrack-house').get('games', { type: 'json' })) || {}, out = {}, since = new Date(Date.now() - 28 * 864e5).toISOString().slice(0, 10);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const [d, hours] of Object.entries(log)) {
    if (d < since || !hours.length) continue;
    const k = days[new Date(d + 'T12:00:00Z').getUTCDay()], o = out[k] = out[k] || { from: 24, to: 0, weeks: 0 };
    o.weeks++; o.from = Math.min(o.from, ...hours); o.to = Math.max(o.to, ...hours.map(x => x + 1));
  }
  return Object.fromEntries(Object.entries(out).filter(([, o]) => o.weeks >= 2));
}

// 10-09 idea 21: minutes per app per day from desktop Gwen's per-minute report (exe names only), kept 14 days
let tallied = 0;
async function logApp(app) {
  const min = Math.floor(Date.now() / 60e3);
  if (!app || min === tallied) return;
  tallied = min;
  const store = blobStore('daytrack-house'), log = (await store.get('apps', { type: 'json' })) || {}, d = today(), exe = String(app).replace(/[^\w .+-]/g, '').slice(0, 60);
  if (!exe) return;
  log[d] = { ...(log[d] || {}), [exe]: ((log[d] || {})[exe] || 0) + 1 };
  const since = dayAdd(d, -13);
  await store.setJSON('apps', Object.fromEntries(Object.entries(log).filter(([k]) => k >= since)));
}

// 10-09 idea 22: the next day's tasks for desktop Gwen's bedtime nudge. Before 5 AM the day that already started counts as tomorrow.
const timeOf = t => { const r = t.reminder, at = typeof r === 'string' ? r : r && r.type === 'time' ? r.time : null; return /^\d{1,2}:\d{2}$/.test(at || '') ? at.padStart(5, '0') : null; };
async function tomorrow() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone, now = localNow(tz), date = now.min < 5 * 60 ? now.date : dayAdd(now.date, 1);
  const dow = new Date(date + 'T12:00:00Z').getUTCDay(), store = blobStore('daytrack'), { blobs } = await store.list();
  let tasks = [];
  for (const { key } of blobs) { const d = await store.get(key, { type: 'json' }); if (d && Array.isArray(d.tasks) && d.tasks.length > tasks.length) tasks = d.tasks; }
  const list = tasks.filter(t => t.recurring ? !t.days || !t.days.length || t.days.includes(dow) : !(t.done || []).length && (!t.date || t.date <= date))
    .filter(t => !(t.done || []).includes(date)).map(t => ({ name: String(t.name || '').slice(0, 80), time: timeOf(t) }));
  list.sort((a, b) => (a.time ? 0 : 1) - (b.time ? 0 : 1) || (a.time || '').localeCompare(b.time || ''));
  return { date, tomorrow: list.slice(0, 20) };
}

export async function status() {
  const report = live.report;
  let gwen = false;
  try { gwen = (await fetch('http://127.0.0.1:5052/daytrack/ping', { signal: AbortSignal.timeout(1500) })).ok; } catch (_) {}
  const fresh = report && Date.now() - report.at < 3 * 60e3;
  let airi = fresh && typeof report.airi === 'boolean' ? report.airi : null, game = fresh && 'game' in report ? report.game : undefined;
  if (airi === null || game === undefined) {
    const list = await processes();
    if (airi === null) airi = list.some(p => /^airi\.exe$/i.test(p));
    if (game === undefined) game = (GAMES.find(([re]) => list.some(p => re.test(p))) || [])[1] || null;
  }
  if (fresh && typeof report.gwen === 'boolean') gwen = gwen || report.gwen;
  const pr = await phonePrayers().catch(() => null), ram = ramadan(today());
  return { pc: true, gwen, airi, game, reportedAt: fresh ? report.at : null, version: (globalThis.dtHooks && globalThis.dtHooks.version) || null, mac: wakeMac(),
    // Idea 5: desktop Gwen keeps quiet near iftar
    ramadan: { active: ram.today, day: ram.day || null, ...(ram.today && pr ? { iftar: pr.Maghrib, suhoor: pr.Fajr } : {}) } };
}

// Start-Gwen.bat in Documents\Gwen (her relay, bridge and AIRI); also the status page's start button
export function startGwen() {
  const dir = process.env.DT_GWEN_DIR || '', bat = ['Start-Gwen-Remote.bat', 'Start-Gwen.bat'].find(f => dir && fs.existsSync(path.join(dir, f)));
  if (!bat) return { ok: false, error: 'Start-Gwen.bat not found in Documents\\Gwen' };
  spawn('cmd.exe', ['/d', '/c', bat], { cwd: dir, detached: true, windowsHide: true, stdio: 'ignore' }).unref();
  return { ok: true, ran: bat };
}

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  // 10-09 idea 24: a file sent from the PC. Its random id is the key, so the phone's downloader needs no Gwen key in the link.
  if (event.httpMethod === 'GET' && q.file) {
    const f = /^[a-f0-9]{32}$/.test(q.file) && await blobStore('daytrack-house').get('file-' + q.file, { type: 'json' });
    if (!f) return json(404, { error: 'No such file (files are kept 7 days)' });
    return { statusCode: 200, headers: { 'Content-Type': f.type, 'Content-Disposition': `attachment; filename="${f.name.replace(/"/g, '')}"`, 'Cache-Control': 'no-store' }, body: Buffer.from(f.b64, 'base64') };
  }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  if (event.httpMethod === 'GET') {
    if (q.apps) return json(200, { days: (await blobStore('daytrack-house').get('apps', { type: 'json' })) || {} });
    if (q.tomorrow) return json(200, await tomorrow());
    if (q.inbox) {
      // 10-09 idea 36: texts and reminders held for the desktop (taken once; kept while he games)
      live.inboxAt = Date.now();
      const messages = whereNow().where === 'gaming' ? [] : live.inbox;
      if (messages.length) live.inbox = [];
      return json(200, { messages });
    }
    return json(200, q.games ? { nights: await gameNights() } : { ...await status(), ...await sharedState(today()) });
  }
  const hooks = globalThis.dtHooks || {};

  switch (body.action) {
    case 'report':
      live.report = { at: Date.now(), ...(typeof body.gwen === 'boolean' ? { gwen: body.gwen } : {}), ...(typeof body.airi === 'boolean' ? { airi: body.airi } : {}),
        ...('game' in body ? { game: body.game ? String(body.game).slice(0, 60) : null } : {}), app: body.app ? String(body.app).slice(0, 60) : null,
        ...(Number.isFinite(body.idle) ? { idle: body.idle } : {}) };
      await logGame(live.report.game).catch(e => console.error('Game log:', e.message));
      if (!live.report.game) await logApp(body.app).catch(e => console.error('App log:', e.message));
      return json(200, { ok: true });
    case 'quest': return json(200, await questDone(today(), body.id, 'desktop'));
    case 'clue':
    case 'focus': { const r = await sharedEvent(today(), body.action, body, 'pc'); return json(r.ok === false ? 400 : 200, r); }
    case 'start': { const r = startGwen(); return json(r.ok ? 200 : 404, r); }
    case 'send': {
      // 10-09 idea 24: "Gwen, send this to my phone": text, a picture or a file into her DayTrack chat
      const text = String(body.text || '').trim().slice(0, 2000), m = String(body.file || '').match(/^data:([\w.+-]+\/[\w.+-]+)?(?:;[^,]*)?;base64,(.+)$/);
      if (!text && !body.image && !m) return json(400, { error: 'text, image or file needed' });
      if (m && m[2].length > 27e6) return json(413, { error: 'Files up to 20 MB' });
      const image = body.image && shrink(body.image, 1080), store = blobStore('daytrack-house'), id = crypto.randomBytes(16).toString('hex');
      if (body.image && !image) return json(400, { error: 'image must be a data:image/... URL' });
      let file;
      if (m) {
        const name = String(body.name || 'file').replace(/[\\/:*?"<>|\r\n]/g, '_').slice(0, 120) || 'file';
        await store.setJSON('file-' + id, { name, type: m[1] || 'application/octet-stream', b64: m[2], at: Date.now() });
        const files = ((await store.get('files', { type: 'json' })) || []).concat({ id, at: Date.now() }), old = files.filter(f => Date.now() - f.at > 7 * 864e5);
        for (const f of old) await store.delete('file-' + f.id).catch(() => {});
        await store.setJSON('files', files.filter(f => !old.includes(f)));
        file = { id, name, size: Math.round(m[2].length * 0.75) };
      }
      const sent = await gwenText(text || (file ? `📎 ${file.name}` : '📷 From your PC'), image, file ? { file } : undefined);
      return json(200, { ok: sent > 0, id });
    }
    case 'lock':
      if (process.platform !== 'win32') return json(501, { error: 'Windows only' });
      spawn('rundll32.exe', ['user32.dll,LockWorkStation'], { detached: true, stdio: 'ignore' }).unref();
      return json(200, { ok: true });
    case 'panel':
    case 'update':
      if (!hooks[body.action]) return json(501, { error: 'Only in DayTrack.exe' });
      setTimeout(() => hooks[body.action](true), 300); // answer the phone before an update closes the app
      return json(200, { ok: true });
  }
  return json(400, { error: 'Unknown action' });
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
