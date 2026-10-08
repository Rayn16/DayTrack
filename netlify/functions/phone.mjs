import { lambda } from '../lib/fn.mjs';
import { keyOk, gwenText } from '../lib/house.mjs';
import { gwenWrite } from '../lib/gwen.mjs';

// Things the phone app itself sends from the background (no page open). Idea 39: once a day, how long he spent in apps,
// and Gwen tells him kindly. Body: {key, event: "screen", minutes, apps: [{name, minutes}]}
const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Bad JSON' }); }
  if (!keyOk(body.key)) return json(401, { error: 'Wrong key' });
  if (body.event !== 'screen') return json(400, { error: 'Unknown event' });
  const mins = Math.max(0, Math.round(Number(body.minutes) || 0));
  const apps = (Array.isArray(body.apps) ? body.apps : []).slice(0, 5).map(a => ({ name: String(a.name || '').slice(0, 40), minutes: Math.round(Number(a.minutes) || 0) })).filter(a => a.name && a.minutes > 0);
  const t = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  const top = apps.map(a => `${a.name} ${t(a.minutes)}`).join(', ');
  const text = await gwenWrite(`It's his daily phone-time check-in, which he turned on himself. Today he spent ${t(mins)} on his phone${top ? ` (most: ${top})` : ''}. Tell him kindly, mention the top app, and if it's a lot (over 5 hours) gently suggest a break or something offline with you; if it's little, be proud. Never lecture.`,
    `${t(mins)} on your phone today${apps[0] ? `, mostly ${apps[0].name}` : ''} 📱 ${mins > 300 ? 'Maybe a little break with me tonight?' : 'Not bad at all 💜'}`);
  return json(200, { ok: (await gwenText(text)) > 0, text });
};

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
