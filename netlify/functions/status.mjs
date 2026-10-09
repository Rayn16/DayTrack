import { lambda } from '../lib/fn.mjs';
import { keyOk, live } from '../lib/house.mjs';
import { status, startGwen } from './pc.mjs';
import { execFile } from 'node:child_process';

// 10-09 idea 38: is each part of Gwen up, and a safe start for one that's down. Never kills anything; nothing starts while a game is open.
const up = url => fetch(url, { signal: AbortSignal.timeout(1500) }).then(() => true, () => false); // any answer = running
const tailscale = () => new Promise(ok => {
  const run = (exe, next) => execFile(exe, ['status', '--json'], { windowsHide: true, timeout: 4000 }, (e, out) => {
    if (e) return next ? run(next) : ok(null);
    try { ok(JSON.parse(out)); } catch (_) { ok(null); }
  });
  run('tailscale', process.platform === 'win32' ? 'C:\\Program Files\\Tailscale\\tailscale.exe' : null);
});

async function parts() {
  const [pc, voice, bridge, ts] = await Promise.all([status(), up('http://127.0.0.1:5050/'), up('http://127.0.0.1:5052/daytrack/ping'), tailscale()]);
  const house = Date.now() - live.houseSeen < 60e3, tsOn = !!ts && ts.BackendState === 'Running';
  return { game: pc.game || null, parts: [
    { id: 'airi', name: 'Gwen on the desktop (AIRI)', ok: !!pc.airi, detail: pc.airi ? 'Running' : 'Not running' },
    { id: 'voice', name: 'Her voice and brain', ok: voice, detail: voice ? 'Running' : 'Not running' },
    { id: 'bridge', name: 'Her phone bridge', ok: bridge, detail: bridge ? 'Running' : 'Not running' },
    { id: 'house', name: 'Gwen\'s House', ok: house, detail: house ? 'Open' : 'Closed (open it from the desktop shortcut)' },
    { id: 'daytrack', name: 'DayTrack on the PC', ok: true, detail: pc.version ? 'Version ' + pc.version : 'Running' },
    { id: 'tailscale', name: 'Tailscale', ok: tsOn, detail: tsOn ? (ts.Self && ts.Self.DNSName || '').replace(/\.$/, '') || 'Connected' : ts ? 'Stopped' : 'Not found' },
  ] };
}

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  const now = await parts();
  if (event.httpMethod === 'GET') return json(200, now);
  const part = now.parts.find(p => p.id === body.start);
  if (!part || !['airi', 'voice', 'bridge'].includes(part.id)) return json(400, { error: 'Only Gwen\'s parts (airi, voice, bridge) can be started from here' });
  if (now.game) return json(409, { error: 'game', game: now.game });
  if (part.ok) return json(200, { ok: true, already: true });
  const r = startGwen();
  return json(r.ok ? 200 : 404, r);
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
