import { lambda } from '../lib/fn.mjs';
import { keyOk } from '../lib/house.mjs';
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
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
  return { pc: true, gwen, airi, game, reportedAt: fresh ? report.at : null, version: (globalThis.dtHooks && globalThis.dtHooks.version) || null };
}

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  if (event.httpMethod === 'GET') return json(200, await status());
  const hooks = globalThis.dtHooks || {}, dir = process.env.DT_GWEN_DIR || '';

  switch (body.action) {
    case 'report':
      report = { at: Date.now(), ...(typeof body.gwen === 'boolean' ? { gwen: body.gwen } : {}), ...(typeof body.airi === 'boolean' ? { airi: body.airi } : {}),
        ...('game' in body ? { game: body.game ? String(body.game).slice(0, 60) : null } : {}) };
      return json(200, { ok: true });
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
