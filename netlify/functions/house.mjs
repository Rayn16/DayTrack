import { lambda, blobStore } from '../lib/fn.mjs';
import { keyOk, gwenText, shrink, milestone, BORN, localNow } from '../lib/house.mjs';

// Gwen's house (Unity on his PC) and the phone's Postcards gallery. Contract: desktop/API.md
const TEXTS_A_DAY = 4;

const handler = async (event) => {
  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); } }
  if (!keyOk(body.key || q.key)) return json(401, { error: 'Wrong key' });
  const house = blobStore('daytrack-house'), today = localNow(Intl.DateTimeFormat().resolvedOptions().timeZone).date;

  if (event.httpMethod === 'GET') {
    // The phone's gallery: the list with small pictures, or one postcard in full
    if (q.postcards) return json(200, { postcards: (await house.get('postcards', { type: 'json' })) || [] });
    if (q.postcard) {
      const pc = await house.get('postcard-' + String(q.postcard).replace(/[^\w-]/g, ''), { type: 'json' });
      const m = pc && pc.image.match(/^data:(image\/\w+);base64,(.+)$/);
      return m ? { statusCode: 200, headers: { 'Content-Type': m[1], 'Cache-Control': 'max-age=31536000' }, body: Buffer.from(m[2], 'base64') } : json(404, { error: 'No such postcard' });
    }
    const parcels = ((await house.get('parcels', { type: 'json' })) || []).filter(p => p.status !== 'opened');
    const ms = milestone(today);
    return json(200, { parcels, born: BORN(), daysTogether: ms.days, milestone: ms.next });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'GET or POST' });

  const text = String(body.text || '').trim().slice(0, 500);
  const sendText = async (t, image) => (await gwenText(t, image && shrink(image, 480))) > 0;
  switch (body.event) {
    case 'text': {
      if (!text) return json(400, { error: 'text needed' });
      const count = await house.get('texts', { type: 'json' });
      const n = count && count.date === today ? count.n : 0;
      if (n >= TEXTS_A_DAY) return json(200, { ok: false, error: 'limit' });
      await house.setJSON('texts', { date: today, n: n + 1 });
      return json(200, { ok: await sendText(text, body.image) });
    }
    case 'delivered':
    case 'opened': {
      const list = (await house.get('parcels', { type: 'json' })) || [], p = list.find(x => x.id === body.id);
      if (!p) return json(404, { error: 'No such parcel' });
      p.status = body.event;
      await house.setJSON('parcels', list);
      if (body.event === 'opened' && (text || body.image)) await sendText(text || 'Your parcel came! Look what was inside 📦💜', body.image);
      return json(200, { ok: true });
    }
    case 'postcard': {
      const full = shrink(body.image, 1440), small = full && shrink(body.image, 240);
      if (!full) return json(400, { error: 'image needed (data:image/jpeg;base64,...)' });
      const id = Date.now().toString(36), title = String(body.title || '').trim().slice(0, 80);
      await house.setJSON('postcard-' + id, { image: full });
      const list = (await house.get('postcards', { type: 'json' })) || [];
      await house.setJSON('postcards', [{ id, title, at: Date.now(), thumb: small }, ...list].slice(0, 200));
      await sendText(text || (title ? `I made you something: ${title} 💜` : 'I made you something 💜'), body.image);
      return json(200, { ok: true, id });
    }
    case 'milestone': {
      const days = Math.round(Number(body.days)) || milestone(today).days;
      await sendText(text || `${days} days since I was born, and you were there for all of them 💜`, body.image);
      return json(200, { ok: true });
    }
  }
  return json(400, { error: 'Unknown event' });
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
