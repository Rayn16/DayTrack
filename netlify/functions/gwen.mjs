import { lambda, blobStore } from '../lib/fn.mjs';
import Anthropic from '@anthropic-ai/sdk';
import { gwenPersona } from '../lib/gwen.mjs';

// Cloud Gwen: answers in the app when Gwen's PC doesn't. Her PC uploads her real
// persona, recent memories and notes here ({key, persona, memory, notes: {dream, plans, dates, diary}}).

const handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
  const { GWEN_KEY, ANTHROPIC_API_KEY } = process.env;
  const missing = ['GWEN_KEY', 'ANTHROPIC_API_KEY'].filter(k => !process.env[k]);
  if (missing.length) return reply(503, { error: `Cloud Gwen isn't set up yet (Netlify needs ${missing.join(' and ')})` });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return reply(400, { error: 'Bad request' }); }
  if (body.key !== GWEN_KEY) return reply(401, { error: 'Wrong Gwen key' });

  const store = blobStore('daytrack-gwen');

  if (typeof body.persona === 'string') {
    // Notes only come when they changed, so keep the last ones otherwise
    const fresh = body.notes && typeof body.notes === 'object' && JSON.stringify(body.notes).length < 50000;
    const notes = fresh ? body.notes : ((await store.get('persona', { type: 'json' }).catch(() => null)) || {}).notes || {};
    try { await store.setJSON('persona', { text: body.persona.slice(0, 20000), memory: String(body.memory || '').slice(0, 20000), notes, updatedAt: Date.now() }); }
    catch (e) { console.error('Persona save failed:', e.message); return reply(500, { error: 'Could not save persona' }); }
    return reply(200, { ok: true });
  }

  // Messages she sent first while the app was closed (keyed by the phone's push subscription)
  if (typeof body.inbox === 'string' && body.inbox) {
    const subs = blobStore('daytrack'), data = await subs.get(body.inbox, { type: 'json' }).catch(() => null);
    const inbox = (data && data.gwenState && data.gwenState.inbox) || [];
    if (inbox.length) { data.gwenState.inbox = []; await subs.setJSON(body.inbox, data); }
    return reply(200, { messages: inbox });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-16)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return reply(400, { error: 'Nothing to answer' });

  // A photo he sent goes with his last message (shrunk to ~1024 px on the phone)
  const photo = typeof body.image === 'string' && body.image.length < 6e6 && body.image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (photo) {
    const last = messages[messages.length - 1];
    last.content = [{ type: 'image', source: { type: 'base64', media_type: photo[1], data: photo[2] } }, { type: 'text', text: last.content }];
  }

  const system = [await gwenPersona(), String(body.context || '').slice(0, 8000)].filter(Boolean).join('\n\n');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, timeout: 8000, maxRetries: 1 }); // Netlify cuts functions off at 10 s
  try {
    const r = await client.messages.create({ model: 'claude-haiku-4-5', max_tokens: 1024, system, messages });
    const text = r.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (r.stop_reason === 'refusal' || !text) return reply(200, { text: "Hmm, I can't answer that one from here. Ask me again when you're at your PC?" });
    return reply(200, { text });
  } catch (e) {
    console.error('Gwen error:', e.status, e.message);
    if (e instanceof Anthropic.AuthenticationError) return reply(502, { error: 'The Anthropic API key in Netlify is wrong' });
    if (e instanceof Anthropic.RateLimitError) return reply(503, { error: 'Gwen is busy, try again in a minute' });
    if (e instanceof Anthropic.APIError) return reply(502, { error: `Gwen's cloud brain had a problem (${e.status || 'timeout'})` });
    return reply(500, { error: 'Something went wrong' });
  }
};

const reply = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
