import { lambda } from '../lib/fn.mjs';
import { keyOk, localNow, questDone, phonePrayers, ramadan } from '../lib/house.mjs';
import { blobStore } from '../lib/fn.mjs';
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Gwen's PC from the phone: is it on, is Gwen running, is a game open; start Gwen, lock the PC. Contract: desktop/API.md
let report = null; // what desktop Gwen last told us

// ponytail: a short list of games for when desktop Gwen isn't reporting; her report is the real source
const GAMES = [[/^theisle/i, 'The Isle'], [/^fivem/i, 'FiveM'], [/^gta5/i, 'GTA V'], [/^marvel-win64/i, 'Marvel Rivals'], [/^league of legends/i, 'League of Legends'],
  [/^valorant-win64/i, 'Valorant'], [/^cs2\.exe/i, 'Counter-Strike 2'], [/^fortniteclient/i, 'Fortnite'], [/^robloxplayer/i, 'Roblox']];

const processes = () => new Promise(ok => {
  if (process.platform !== 'win32') return ok([]);
  execFile('tasklist', ['/fo', 'csv', '/nh'], { windowsHide: true, timeout: 5000 }, (e, out) => ok(e ? [] : out.split('\n').map(l => (l.match(/^"([^"]+)"/) || [])[1]).filter(Boolean)));
});

// Idea 30: the phone wakes the PC with a magic packet to this network card (wired first; not Tailscale, VPNs or virtual ones)
export function wakeMac() {
  const cards = Object.entries(os.networkInterfaces()).filter(([name, a]) => !/loopback|tailscale|vethernet|virtual|vmware|vpn|hyper-v|bluetooth|wsl/i.test(name)
    && a.some(x => x.family === 'IPv4' && !x.internal && x.mac && x.mac !== '00:00:00:00:00:00' && !x.address.startsWith('100.')));
  cards.sort(([a], [b]) => /wi-?fi|wireless|wlan/i.test(a) - /wi-?fi|wireless|wlan/i.test(b));
  return cards.length ? cards[0][1].find(x => x.family === 'IPv4').mac : null;
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

async function status() {
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

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  if (event.httpMethod === 'GET') return json(200, q.games ? { nights: await gameNights() } : await status());
  const hooks = globalThis.dtHooks || {}, dir = process.env.DT_GWEN_DIR || '';

  switch (body.action) {
    case 'report':
      report = { at: Date.now(), ...(typeof body.gwen === 'boolean' ? { gwen: body.gwen } : {}), ...(typeof body.airi === 'boolean' ? { airi: body.airi } : {}),
        ...('game' in body ? { game: body.game ? String(body.game).slice(0, 60) : null } : {}) };
      await logGame(report.game).catch(e => console.error('Game log:', e.message));
      return json(200, { ok: true });
    case 'quest': return json(200, await questDone(today(), body.id, 'desktop'));
    case 'start': {
      const bat = ['Start-Gwen-Remote.bat', 'Start-Gwen.bat'].find(f => dir && fs.existsSync(path.join(dir, f)));
      if (!bat) return json(404, { error: 'Start-Gwen.bat not found in Documents\\Gwen' });
      spawn('cmd.exe', ['/d', '/c', bat], { cwd: dir, detached: true, windowsHide: true, stdio: 'ignore' }).unref();
      return json(200, { ok: true, ran: bat });
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
