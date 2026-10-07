// The DayTrack server, running inside DayTrack.exe on the PC: the same functions that ran on Netlify
// (sync, reminders, Gwen's texts, cloud Gwen), with their data in files. The phone reaches it through
// Tailscale (https://<pc>.ts.net/dt/...), and it passes the phone's calls for Gwen on to her bridge.
const http = require('http');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

const PORT = 5053;
const BRIDGE = 'http://127.0.0.1:5052';
const OLD_SERVER = 'https://yasuomain.netlify.app'; // only to bring sync data over the first time
const NAMES = ['sync', 'save-reminder', 'reminder-action', 'check-reminders', 'gwen', 'test-push', 'outbox'];
const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*'};

// Netlify Blobs' get/setJSON/list, one JSON file per key
function fileStore(dir) {
  return name => {
    const d = path.join(dir, name), file = k => path.join(d, encodeURIComponent(k) + '.json');
    return {
      async get(k) { try { return JSON.parse(fs.readFileSync(file(k), 'utf8')); } catch (_) { return null; } },
      async setJSON(k, v) { fs.mkdirSync(d, {recursive: true}); fs.writeFileSync(file(k) + '.tmp', JSON.stringify(v)); fs.renameSync(file(k) + '.tmp', file(k)); },
      async list() { try { return {blobs: fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => ({key: decodeURIComponent(f.slice(0, -5))}))}; } catch (_) { return {blobs: []}; } },
    };
  };
}

// Keys: Documents\Gwen\daytrack.json, the file Gwen's bridge already keeps ({"key", "sync_code"}), plus "anthropicKey"
function loadKeys(file) {
  let k = {};
  try { k = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { console.warn('No keys file at', file); }
  if (k.gwenKey || k.key) process.env.GWEN_KEY = k.gwenKey || k.key;
  if (k.anthropicKey) process.env.ANTHROPIC_API_KEY = k.anthropicKey;
}

async function start({dataDir, keysFile, fnDir}) {
  loadKeys(keysFile);
  globalThis.dtStore = fileStore(dataDir);
  const fns = {};
  for (const n of NAMES) fns[n] = (await import(pathToFileURL(path.join(fnDir, n + '.mjs')).href)).default;

  // First time a sync code shows up here, bring its data over from the old server
  const sync = fns.sync;
  fns.sync = async req => {
    const code = new URL(req.url).searchParams.get('code');
    const store = globalThis.dtStore('daytrack-sync');
    if (req.method === 'GET' && /^[a-f0-9]{32}$/.test(code || '') && !(await store.get(code))) {
      try {
        const r = await fetch(`${OLD_SERVER}/.netlify/functions/sync?code=${code}`, {signal: AbortSignal.timeout(8000)});
        const d = r.ok && await r.json();
        if (d) await store.setJSON(code, d);
      } catch (e) { console.warn('Old sync data not reachable:', e.message); }
    }
    return sync(req);
  };

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
      const url = new URL(req.url.replace(/^\/dt(?=\/)/, ''), 'http://localhost');
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await new Promise((ok, fail) => {
        const parts = []; req.on('data', c => parts.push(c)); req.on('end', () => ok(Buffer.concat(parts))); req.on('error', fail);
      });
      let r;
      const fn = url.pathname.match(/^\/\.netlify\/functions\/([a-z-]+)$/);
      if (fn && fns[fn[1]]) r = await fns[fn[1]](new Request('http://localhost' + url.pathname + url.search, {method: req.method, headers: {'Content-Type': req.headers['content-type'] || 'application/json'}, body}));
      else if (url.pathname.startsWith('/pc/')) {
        // Gwen's bridge, for the phone app (its web page can't call her directly)
        const headers = {...req.headers}; delete headers.host; delete headers.origin;
        r = await fetch(BRIDGE + url.pathname.slice(3) + url.search, {method: req.method, headers, body});
      } else r = new Response('Not found', {status: 404});
      const h = Object.fromEntries([...r.headers].filter(([k]) => !/^(access-control-|content-encoding|content-length|transfer-encoding|connection)/i.test(k)));
      res.writeHead(r.status, {...h, ...CORS});
      res.end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      console.error('Server error:', e.message);
      if (!res.headersSent) res.writeHead(502, CORS);
      res.end();
    }
  });
  await new Promise((ok, fail) => server.once('error', fail).listen(PORT, '127.0.0.1', ok));

  // Reminders and Gwen's texts, every minute like on Netlify
  const tick = () => fns['check-reminders'](new Request('http://localhost/', {method: 'POST'})).catch(e => console.error('Reminders:', e.message));
  setInterval(tick, 60000);
  tick();
  return {fns, server};
}

module.exports = {start, fileStore, PORT};
