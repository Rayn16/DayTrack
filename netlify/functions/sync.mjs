import { lambda, blobStore } from '../lib/fn.mjs';

// Whole DayTrack data set per private sync code (32 hex chars made on the phone).
// inbox-<code> holds tasks Gwen adds from the PC until the phone picks them up; chat-<code> his chat with Gwen (for backups).
const CODE = /^[a-f0-9]{32}$/;

const handler = async (event) => {
  try {
    const store = blobStore('daytrack-sync');
    if (event.httpMethod === 'GET') {
      const code = (event.queryStringParameters || {}).code || '';
      if (!CODE.test(code)) return { statusCode: 400, body: 'Bad code' };
      if ((event.queryStringParameters || {}).inbox) return json((await store.get('inbox-' + code, { type: 'json' })) || []);
      return json(await store.get(code, { type: 'json' }));
    }
    if (event.httpMethod === 'POST') {
      const { code, data, inbox, ack, chat } = JSON.parse(event.body);
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
      await store.setJSON(code, data);
      return json({ ok: true });
    }
    return { statusCode: 405 };
  } catch (e) {
    console.error('Sync error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};

const json = (d) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d ?? null) });

export default lambda(handler);
