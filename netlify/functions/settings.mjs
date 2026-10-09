import { lambda } from '../lib/fn.mjs';
import { keyOk } from '../lib/house.mjs';
import fs from 'node:fs';
import path from 'node:path';

// 10-09 idea 37: one settings page. Desktop Gwen and the house each keep Documents\Gwen\shared-settings\<app>.json
// ({title, items: [{key, label, type, options?, value}]}); DayTrack shows them and writes a changed value back.
const APPS = ['desktop', 'house'];
const file = app => path.join(process.env.DT_GWEN_DIR || '', 'shared-settings', app + '.json');
const read = app => { try { const d = JSON.parse(fs.readFileSync(file(app), 'utf8')); return d && Array.isArray(d.items) ? d : null; } catch (_) { return null; } };
const valid = (it, v) => it.type === 'toggle' ? typeof v === 'boolean' : it.type === 'choice' ? Array.isArray(it.options) && it.options.includes(v)
  : it.type === 'time' ? /^\d{2}:\d{2}$/.test(v) : it.type === 'number' ? Number.isFinite(v) : false;

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  if (!process.env.DT_GWEN_DIR) return json(501, { error: 'Only in DayTrack.exe' });
  if (event.httpMethod === 'GET') return json(200, { apps: APPS.map(app => ({ app, ...read(app) })).filter(a => a.items) });
  const d = APPS.includes(body.app) && read(body.app), it = d && d.items.find(i => i.key === body.item);
  if (!it) return json(404, { error: 'No such setting' });
  if (!valid(it, body.value)) return json(400, { error: 'Bad value for a ' + it.type });
  it.value = body.value;
  fs.writeFileSync(file(body.app) + '.tmp', JSON.stringify(d, null, 2));
  fs.renameSync(file(body.app) + '.tmp', file(body.app));
  return json(200, { ok: true });
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
