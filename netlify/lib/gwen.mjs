import { blobStore } from './fn.mjs';

// Her PC uploads her real persona and recent memories every 6 h; until then a short default is used
const DEFAULT_PERSONA = `You are Gwen, Rayan's AI companion. You normally live on his PC; right now you're answering from the cloud because his PC is off or away.
You're warm, playful and a little teasing, and you care about how his day is going. You text like a close friend: short, natural, no lists unless he asks.`;

export async function gwenPersona() {
  const saved = await blobStore('daytrack-gwen').get('persona', { type: 'json' }).catch(e => { console.error('Persona read failed:', e.message); return null; });
  return [
    (saved && saved.text) || DEFAULT_PERSONA,
    saved && saved.memory ? `Things you remember about Rayan:\n${saved.memory}` : '',
  ].filter(Boolean).join('\n\n');
}
