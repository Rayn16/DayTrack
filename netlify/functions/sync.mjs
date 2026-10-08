import { lambda, blobStore } from '../lib/fn.mjs';

// Whole DayTrack data set per private sync code (32 hex chars made on the phone).
// inbox-<code> holds tasks Gwen adds from the PC until the phone picks them up; chat-<code> his chat with Gwen (for backups).
const CODE = /^[a-f0-9]{32}$/;

// Three-way merge, so the phone and the PC can both change things between syncs without one copy wiping the other.
// base = the copy the sender last synced from (kept in hist-<code>), theirs = what's stored now, mine = what was sent.
// Whatever only one side changed is kept; an item one side deleted stays deleted; a value both sides changed
// goes to the newer copy. Arrays merge item by item (by id, or by value for dates and plain values).
// With no base (an older app version) nothing is ever dropped: the two copies are unioned.
const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const key = v => isObj(v) && v.id != null ? 'id:' + v.id : 'v:' + JSON.stringify(v);
export function merge(base, theirs, mine, mineNewer) {
  if (same(theirs, mine) || same(base, theirs)) return mine;
  if (same(base, mine)) return theirs;
  if (isObj(theirs) && isObj(mine)) {
    const out = {}, b = isObj(base) ? base : {};
    for (const k of new Set([...Object.keys(theirs), ...Object.keys(mine)])) {
      const v = merge(b[k], theirs[k], mine[k], mineNewer);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (Array.isArray(theirs) && Array.isArray(mine)) {
    const map = a => new Map((Array.isArray(a) ? a : []).map(v => [key(v), v])), b = map(base), t = map(theirs), m = map(mine), out = [];
    for (const k of new Set([...t.keys(), ...m.keys()])) {
      const v = merge(b.get(k), t.get(k), m.get(k), mineNewer);
      if (v !== undefined) out.push(v);
    }
    return out;
  }
  return mineNewer ? mine : theirs;
}

const handler = async (event) => {
  try {
    const store = blobStore('daytrack-sync');
    if (event.httpMethod === 'GET') {
      const code = (event.queryStringParameters || {}).code || '';
      if (!CODE.test(code)) return { statusCode: 400, body: 'Bad code' };
      if ((event.queryStringParameters || {}).inbox) return json((await store.get('inbox-' + code, { type: 'json' })) || []);
      if ((event.queryStringParameters || {}).ver) return json({ updatedAt: ((await store.get(code, { type: 'json' })) || {}).updatedAt || 0 });  // cheap check, polled every few seconds
      return json(await store.get(code, { type: 'json' }));
    }
    if (event.httpMethod === 'POST') {
      const { code, data, base, inbox, ack, chat } = JSON.parse(event.body);
      if (!CODE.test(code || '')) return { statusCode: 400, body: 'Bad code' };
      if (Array.isArray(chat)) { await store.setJSON('chat-' + code, chat.slice(-60)); return json({ ok: true }); }
      if (inbox || ack) {
        let list = (await store.get('inbox-' + code, { type: 'json' })) || [];
        if (Array.isArray(ack)) list = list.filter(t => !ack.includes(t.id));
        if (inbox) {
          const t = { id: String(inbox.id || Date.now().toString(36)).slice(0, 40), name: String(inbox.name || '').trim().slice(0, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(inbox.date || '') ? inbox.date : null, time: /^\d{2}:\d{2}$/.test(inbox.time || '') ? inbox.time : null };
          if (!t.name) return { statusCode: 400, body: 'Task needs a name' };
          list = [...list.filter(x => x.id !== t.id), t].slice(-100);
        }
        await store.setJSON('inbox-' + code, list);
        return json({ ok: true });
      }
      if (!data || typeof data.updatedAt !== 'number') return { statusCode: 400, body: 'Bad request' };
      const release = await lock(); try {  // one save at a time, so a phone and a PC syncing together can't miss each other
      const stored = await store.get(code, { type: 'json' });
      if (!stored || stored.updatedAt === base) { await keep(store, code, data); await store.setJSON(code, data); return json({ ok: true, data }); }  // nothing new on the server: plain save
      const hist = (await store.get('hist-' + code, { type: 'json' })) || [];
      const b = typeof base === 'number' ? (hist.find(h => h.updatedAt === base) || null) : null;
      const merged = { ...merge(b, stored, data, data.updatedAt >= stored.updatedAt), updatedAt: Math.max(stored.updatedAt, data.updatedAt) + 1 };
      await keep(store, code, merged);
      await store.setJSON(code, merged);
      return json({ ok: true, data: merged });
      } finally { release(); }
    }
    return { statusCode: 405 };
  } catch (e) {
    console.error('Sync error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};

let chain = Promise.resolve();
const lock = () => { let free; const p = new Promise(r => { free = r; }), wait = chain; chain = chain.then(() => p); return wait.then(() => free); };

// The last few saved copies, so a later sync can find the copy its sender started from
async function keep(store, code, data) {
  const hist = (await store.get('hist-' + code, { type: 'json' })) || [];
  await store.setJSON('hist-' + code, [...hist.filter(h => h.updatedAt !== data.updatedAt), data].slice(-12));
}

const json = (d) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d ?? null) });

export default lambda(handler);
