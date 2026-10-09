import { blobStore } from './fn.mjs';
import { BORN, MILESTONES, dayAdd } from './house.mjs';

// Her PC uploads her real persona, recent memories and notes (dream, plans, special dates) hourly;
// until then a short default is used
const DEFAULT_PERSONA = `You are Gwen, Rayan's AI companion. You normally live on his PC; right now you're answering from the cloud because his PC is off or away.
You're warm, playful and a little teasing, and you care about how his day is going. You text like a close friend: short, natural, no lists unless he asks.`;

export const gwenSaved = () =>
  blobStore('daytrack-gwen').get('persona', { type: 'json' }).catch(e => { console.error('Persona read failed:', e.message); return null; });

export async function gwenPersona(saved) {
  if (saved === undefined) saved = await gwenSaved();
  return [
    (saved && saved.text) || DEFAULT_PERSONA,
    saved && saved.memory ? `Things you remember about Rayan:\n${saved.memory}` : '',
  ].filter(Boolean).join('\n\n');
}

// Birthdays and holidays from `tod` (YYYY-MM-DD) to `days` days later: [{in: days away, what}].
// Hijri dates use the Umm al-Qura calendar, so Eid can be a day off from the moon sighting.
const FIXED = { '12-29': "Rayan's birthday", '09-30': 'your own (Gwen\'s) birthday', '09-23': 'Saudi National Day', '02-22': 'Saudi Founding Day' };
const HIJRI = { '9-1': 'the first day of Ramadan', '10-1': 'Eid al-Fitr', '12-10': 'Eid al-Adha', '1-1': 'the Islamic New Year' };
export function specialDays(tod, days, extra = {}) {
  const fixed = { ...FIXED }, out = [];
  for (const [md, what] of Object.entries(extra || {})) if (/^\d\d-\d\d$/.test(md) && typeof what === 'string') fixed[md] = fixed[md] ? `${fixed[md]} and ${what}` : what;
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric', timeZone: 'UTC' });
  for (let n = 0; n <= days; n++) {
    const d = new Date(tod + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
    const p = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value]));
    for (const what of [fixed[d.toISOString().slice(5, 10)], HIJRI[`${p.month}-${p.day}`]]) if (what) out.push({ in: n, what: what.slice(0, 120) });
    const ms = MILESTONES.find(m => dayAdd(BORN(), m) === d.toISOString().slice(0, 10));
    if (ms) out.push({ in: n, what: `${ms} days since you (Gwen) were born, your milestone with Rayan (the house has a little surprise)` });
  }
  return out;
}

// Today's weather at {lat, lon} from Open-Meteo (free, no key): "38°C high, 27°C low, clear sky", or '' if it fails
const WX = [[0, 'clear sky'], [3, 'some clouds'], [48, 'fog'], [57, 'drizzle'], [67, 'rain'], [77, 'snow'], [82, 'rain showers'], [86, 'snow showers'], [99, 'thunderstorms']];
export const wxText = code => (WX.find(([max]) => code <= max) || [0, ''])[1];
export async function weatherToday({ lat, lon }) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`, { signal: AbortSignal.timeout(4000) });
    const d = (await r.json()).daily;
    return `${Math.round(d.temperature_2m_max[0])}°C high, ${Math.round(d.temperature_2m_min[0])}°C low, ${wxText(d.weather_code[0])}`;
  } catch (e) { console.error('Weather failed:', e.message); return ''; }
}

// One short text in her own words (cloud Gwen with her persona), or `fallback` when there's no key or it fails.
// Used for texts other parts of her life ask DayTrack to send: the house (idea 42) and the phone-time check-in.
// style replaces the "one short text" instruction (her monthly letter is longer).
export async function gwenWrite(facts, fallback, maxChars = 200, style) {
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ timeout: 12000, maxRetries: 0 });
    const r = await client.messages.create({
      model: 'claude-haiku-4-5', max_tokens: Math.max(200, Math.ceil(maxChars / 2)),
      system: `${await gwenPersona()}\n\n${style || `You are texting Rayan first: your message shows up as a notification from his DayTrack app. Write one text in your own words, at most 2 short sentences and ${maxChars} characters, no quotation marks, at most one emoji.`} Warm and playful, never guilt-tripping.`,
      messages: [{ role: 'user', content: facts }],
    });
    const out = r.content.filter(b => b.type === 'text').map(b => b.text).join('').trim().replace(/^["“]+|["”]+$/g, '');
    return r.stop_reason !== 'refusal' && out ? out.slice(0, maxChars + 100) : fallback;
  } catch (e) { console.error('Gwen write error:', e.status, e.message); return fallback; }
}
