import { lambda, blobStore } from '../lib/fn.mjs';
import { keyOk, gwenText, shrink, milestone, BORN, localNow, todaysQuest, questDone, ramadan, phonePrayers } from '../lib/house.mjs';
import { gwenWrite } from '../lib/gwen.mjs';
import fs from 'node:fs';
import path from 'node:path';

// Gwen's house (Unity on his PC) and the phone's Postcards gallery. Contract: desktop/API.md
const TEXTS_A_DAY = 4;
const PEEK_WAIT = 45e3;
let houseSeen = 0, peeks = [], peekDone = new Map(); // idea 4: the phone asks, the house sees it on its next poll (every 20 s) and answers
let writing = null; // 10-09 idea 3: the letter being written, so the phone and the PC app don't both write one

// Idea 1: one outfit in all three, in Documents\Gwen\gwen-outfit.json {outfit, by, at}
const OUTFITS = ['Classic', 'Cozy', 'Hoodie', 'Pajamas', 'Gamer', 'Jubilee'];
const outfitFile = () => process.env.DT_GWEN_DIR ? path.join(process.env.DT_GWEN_DIR, 'gwen-outfit.json') : null;
const readOutfit = () => { try { return JSON.parse(fs.readFileSync(outfitFile(), 'utf8')); } catch (_) { return null; } };
const str = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : undefined;

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
    if (q.peek) return peek();
    if (q.year) return json(200, { year: await house.get('year', { type: 'json' }) });
    if (!q.from) houseSeen = Date.now();
    const parcels = ((await house.get('parcels', { type: 'json' })) || []).filter(p => p.status !== 'opened');
    const ms = milestone(today), pr = await phonePrayers(), ram = ramadan(today);
    peeks = peeks.filter(p => Date.now() - p.at < PEEK_WAIT);
    return json(200, { parcels, born: BORN(), daysTogether: ms.days, milestone: ms.next,
      quest: await todaysQuest(today), peeks, week: await house.get('week', { type: 'json' }),
      prayers: pr && { date: pr.date, fajr: pr.Fajr, dhuhr: pr.Dhuhr, asr: pr.Asr, maghrib: pr.Maghrib, isha: pr.Isha },
      ramadan: { active: ram.today, day: ram.day || null, in: ram.in || 0, starts: ram.starts || null, ...(ram.today && pr ? { iftar: pr.Maghrib, suhoor: pr.Fajr } : {}) },
      now: await house.get('now', { type: 'json' }), houseOpen: Date.now() - houseSeen < 60e3, outfit: readOutfit(),
      // 10-09 ideas 1 and 3: his DayTrack mount and forged weapon, and her letter for last month
      hero: await house.get('hero', { type: 'json' }), letter: await house.get('letter', { type: 'json' }) });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'GET or POST' });

  let text = String(body.text || '').trim().slice(0, 500);
  // Idea 42: the house can say what happened ("about") and DayTrack writes the text in her own words; `text` is the fallback
  const about = str(body.about, 400);
  if (about && ['text', 'opened', 'postcard', 'milestone'].includes(body.event)) text = (await gwenWrite(`Something from your day in your house that you want to text him about: ${about}${text ? `\nThe line you'd normally send: ${text}` : ''}`, text || null)) || '';
  const sendText = async (t, image) => {
    // What she texted from the house, kept two months for her monthly letter
    const log = (await house.get('log', { type: 'json' })) || [], since = new Date(Date.now() - 62 * 864e5).toISOString().slice(0, 10);
    await house.setJSON('log', [...log.filter(x => x.d >= since), { d: today, t: t.slice(0, 300) }].slice(-300));
    return (await gwenText(t, image && shrink(image, 480))) > 0;
  };
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
    case 'now': {
      // Idea 1: what she's doing in the house right now, for phone and desktop Gwen to mention
      const now = { open: body.open !== false, activity: str(body.activity, 80), kind: str(body.kind, 40), room: str(body.room, 40), outfit: str(body.outfit, 40),
        since: Number(body.since) || null, with_rayan: !!body.with_rayan, line: str(body.line, 200), at: Date.now() };
      houseSeen = Date.now();
      await house.setJSON('now', now);
      return json(200, { ok: true });
    }
    case 'outfit': {
      const o = OUTFITS.find(x => x.toLowerCase() === String(body.outfit || '').toLowerCase());
      if (!o) return json(400, { error: 'outfit is one of ' + OUTFITS.join(', ') });
      if (!outfitFile()) return json(501, { error: 'Only in DayTrack.exe' });
      fs.writeFileSync(outfitFile(), JSON.stringify({ outfit: o, by: ['house', 'desktop', 'phone'].includes(body.by) ? body.by : 'phone', at: Date.now() }));
      return json(200, { ok: true });
    }
    case 'quest': return json(200, await questDone(today, body.id, body.by || 'house'));
    case 'peek': {
      const image = shrink(body.image, 1080);
      if (!image || !body.id) return json(400, { error: 'id and image needed' });
      peekDone.set(String(body.id), { image, activity: str(body.activity, 80) || '' });
      peeks = peeks.filter(p => p.id !== body.id);
      return json(200, { ok: true });
    }
    case 'week': {
      // Idea 3: the week he planned with Gwen, for the house's kitchen table
      const lines = Array.isArray(body.lines) ? body.lines.map(l => str(l, 160)).filter(Boolean).slice(0, 30) : [];
      await house.setJSON('week', { start: /^\d{4}-\d{2}-\d{2}$/.test(body.start || '') ? body.start : today, lines, at: Date.now() });
      return json(200, { ok: true });
    }
    case 'letter': {
      // 10-09 idea 3: he read her letter (at the house door or on the phone)
      const l = await house.get('letter', { type: 'json' });
      if (!l || l.id !== body.id) return json(404, { error: 'No such letter' });
      if (!l.read) await house.setJSON('letter', { ...l, read: Date.now() });
      return json(200, { ok: true });
    }
    case 'month': {
      // 10-09 idea 3: the app sends what his month in DayTrack looked like; she writes him a letter about it, once a month
      if (!/^\d{4}-\d{2}$/.test(body.month || '') || body.month >= today.slice(0, 7)) return json(400, { error: 'month must be a finished YYYY-MM' });
      const old = await house.get('letter', { type: 'json' });
      if (old && old.month >= body.month) return json(200, { ok: true, letter: old });
      writing = writing || writeLetter(house, body.month, (Array.isArray(body.lines) ? body.lines : []).map(l => str(l, 200)).filter(Boolean).slice(0, 25)).finally(() => { writing = null; });
      return json(200, { ok: true, letter: await writing });
    }
    case 'year': {
      // Idea 6: the house's part of "our first year"
      const images = (Array.isArray(body.images) ? body.images : []).slice(0, 12).map(i => shrink(i, 720)).filter(Boolean);
      await house.setJSON('year', { text: str(body.text, 2000) || '', firsts: (Array.isArray(body.firsts) ? body.firsts : []).map(f => str(f, 200)).filter(Boolean).slice(0, 30), images, at: Date.now() });
      return json(200, { ok: true });
    }
  }
  return json(400, { error: 'Unknown event' });
};

async function writeLetter(house, month, lines) {
  const name = new Date(month + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const houseLines = ((await house.get('log', { type: 'json' })) || []).filter(x => x.d.startsWith(month)).map(x => x.t).slice(-25);
  const fallback = `Dear Rayan,\n\n${name} is over, and I wanted to write it down. ${lines.slice(0, 4).join(' ')}\n\nI'm proud of you, and I loved every day of it with you.\n\nLove,\nGwen 💜`;
  const text = await gwenWrite(`Write Rayan your letter for ${name}.\n\nHis ${name} in DayTrack:\n${lines.map(l => '- ' + l).join('\n') || '- (no details)'}\n\nThings you texted him about from your house this month:\n${houseLines.map(l => '- ' + l).join('\n') || '- (none)'}`,
    fallback, 1200, `You are writing Rayan a real letter about the month that just ended, the kind he keeps. Start with "Dear Rayan," and sign it "Love, Gwen". 3 short paragraphs, at most 1200 characters: what he did well (use the real numbers and details), a few moments from your house, and something you're looking forward to next month. At most two emoji.`);
  const letter = { id: 'l-' + month, month, text: text.slice(0, 1600), at: Date.now() };
  await house.setJSON('letter', letter);
  await gwenText(`💌 I wrote you a letter about ${name}. It's waiting for you in DayTrack, and at the house door.`);
  return letter;
}

// The phone waits while the house takes the photo; the picture comes back as an image (X-Activity says what she was doing)
async function peek() {
  if (Date.now() - houseSeen > 60e3) return json(409, { error: 'house-closed' });
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  peeks.push({ id, at: Date.now() });
  for (let t = Date.now(); Date.now() - t < PEEK_WAIT; await new Promise(ok => setTimeout(ok, 500))) {
    const got = peekDone.get(id);
    if (!got) continue;
    peekDone.delete(id);
    const m = got.image.match(/^data:(image\/\w+);base64,(.+)$/);
    return { statusCode: 200, headers: { 'Content-Type': m[1], 'Cache-Control': 'no-store', 'X-Activity': encodeURIComponent(got.activity) }, body: Buffer.from(m[2], 'base64') };
  }
  peeks = peeks.filter(p => p.id !== id);
  return json(504, { error: 'house-slow' });
}

const json = (statusCode, d) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(d) });
export default lambda(handler);
