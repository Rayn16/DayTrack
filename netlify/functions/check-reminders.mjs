import { lambda, blobStore } from '../lib/fn.mjs';
import webpush from 'web-push';
import Anthropic from '@anthropic-ai/sdk';
import { gwenPersona } from '../lib/gwen.mjs';

const handler = async () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log('Missing env vars:', { VAPID_PUBLIC_KEY: !!VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY: !!VAPID_PRIVATE_KEY });
    return { statusCode: 200 };
  }

  webpush.setVapidDetails('mailto:r.alljhanii.4@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const store = blobStore('daytrack');
  const { blobs } = await store.list();

  const nowMs = Date.now();

  console.log(`Found ${blobs.length} subscription(s) in store`);

  for (const { key } of blobs) {
    const data = await store.get(key, { type: 'json' });
    if (!data) { console.log(`Key ${key}: no data`); continue; }

    const { subscription, tasks = [], completedDays = [] } = data;
    // The server clock is UTC, so work in the phone's own timezone
    const { min: nowMin, date: todStr, dow } = localNow(data.tz);
    const isSunday = dow === 0;
    const isSummaryTime = nowMin >= 20 * 60 && nowMin <= 20 * 60 + 2;
    let changed = false;

    // Task reminders
    for (const t of tasks) {
      if (!t.reminder) continue;
      const r = t.reminder;
      const done = t.done || [];
      if (t.recurring && t.days && t.days.length && !t.days.includes(dow)) continue; // not one of its days
      if (done.includes(todStr) || (!t.recurring && done.length)) continue;            // already done
      if (!t.recurring && t.date && t.date > todStr) continue;                          // dated for later

      if (t.snoozeUntil && nowMs >= t.snoozeUntil) {
        await notify(webpush, subscription, `Snoozed: ${t.name}`, t.notifStyle, t.id);
        t.snoozeUntil = null;
        changed = true;
        continue;
      }

      const timeStr = typeof r === 'string' ? r : r.type === 'time' ? r.time : null;
      if (timeStr) {
        const [rh, rm] = timeStr.split(':').map(Number);
        if (Math.abs(nowMin - (rh * 60 + rm)) <= 1 && t.lastFiredDate !== todStr) {
          await notify(webpush, subscription, `Time for: ${t.name}`, t.notifStyle, t.id);
          t.lastFiredDate = todStr;
          changed = true;
        }
      } else if (r.type === 'interval') {
        const ms = (r.h * 60 + r.m) * 60000;
        console.log(`Task "${t.name}": interval ${r.h}h${r.m}m, ms=${ms}, since last=${nowMs-(t.lastFiredMs||0)}`);
        if (inQuiet(nowMin, data.quiet)) continue; // fires again once quiet hours end
        if (ms > 0 && !t.lastFiredMs) {
          t.lastFiredMs = nowMs; // start counting from now, first reminder after one interval
          changed = true;
        } else if (ms > 0 && nowMs - t.lastFiredMs >= ms) {
          await notify(webpush, subscription, `Reminder: ${t.name}`, t.notifStyle, t.id);
          t.lastFiredMs = nowMs;
          changed = true;
        }
      }
    }

    // Weekly summary (Sundays ~8pm)
    if (isSunday && isSummaryTime && data.lastWeeklySent !== todStr) {
      const last7 = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(todStr + 'T12:00:00Z');
        d.setUTCDate(d.getUTCDate() - i);
        last7.push(d.toISOString().split('T')[0]);
      }
      const completedCount = last7.filter(d => completedDays.includes(d)).length;
      const msg =
        completedCount === 7 ? '🏆 Perfect week! All 7 days fully completed!' :
        completedCount >= 5 ? `⭐ Great week! ${completedCount}/7 days fully completed` :
        completedCount >= 3 ? `📊 Week recap: ${completedCount}/7 days completed` :
        '💪 New week ahead — open DayTrack to plan your goals!';
      console.log(`Weekly summary for key ${key.slice(0,8)}: ${completedCount}/7 days`);
      await notify(webpush, subscription, msg);
      data.lastWeeklySent = todStr;
      changed = true;
    }

    // Gwen texts first: a morning hello, then an evening nudge (or a cheer if all is done). At most 2 a day.
    if (data.gwen && !inQuiet(nowMin, data.quiet)) {
      const g = data.gwenState = data.gwenState || {};
      const wake = data.quiet && data.quiet.on ? toMin(data.quiet.to) : 9 * 60;
      const slot = nowMin >= wake && nowMin < wake + 180 && g.hello !== todStr ? 'hello'
        : nowMin >= 19 * 60 + 30 && nowMin < 22 * 60 && g.evening !== todStr ? 'evening' : null;
      if (slot) {
        g[slot] = todStr; // once a day, even if there was nothing to say
        changed = true;
        const msg = await gwenCheckin(slot, data, tasks, todStr, dow);
        if (msg) {
          await notify(webpush, subscription, msg.text, 'default', msg.taskId, '💜 Gwen');
          g.inbox = [...(g.inbox || []), { text: msg.text, at: nowMs }].slice(-10);
        }
      }
    }

    if (changed) await store.setJSON(key, { ...data, subscription, tasks });
  }

  return { statusCode: 200 };
};

function localNow(tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(new Date());
  } catch (_) {
    return localNow('UTC'); // unknown timezone name
  }
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return {
    min: Number(p.hour) * 60 + Number(p.minute),
    date: `${p.year}-${p.month}-${p.day}`,
    dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
  };
}

const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

function inQuiet(min, q) {
  if (!q || !q.on) return false;
  const f = toMin(q.from), t = toMin(q.to);
  return f <= t ? (min >= f && min < t) : (min >= f || min < t); // window can cross midnight
}

// What Gwen says when she texts first. Written by cloud Gwen with her persona and memories; a plain line if that fails.
async function gwenCheckin(slot, data, tasks, tod, dow) {
  const day = n => { const d = new Date(tod + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
  const today = tasks.filter(t => t.recurring ? !t.days || !t.days.length || t.days.includes(dow) : (t.done || []).length ? t.done.includes(tod) : !t.date || t.date <= tod);
  const open = today.filter(t => !(t.done || []).includes(tod));
  if (slot === 'evening' && !today.length) return null;
  const full = new Set(data.completedDays || []);
  let streak = 0; while (full.has(day(streak + 1))) streak++;                       // full days in a row up to yesterday
  let ended = 0; if (!full.has(day(1))) while (full.has(day(ended + 2))) ended++;   // a streak that broke yesterday
  const away = [1, 2, 3].every(n => !full.has(day(n))) && [...full].some(d => d >= day(14));
  const moods = data.moods || {}, mood = moods[tod] || moods[day(1)];
  const one = slot === 'evening' && open.length === 1 && !open[0].recurring ? open[0] : null;

  const names = list => list.map(t => t.name + (!t.recurring && t.date && t.date < tod ? ' (overdue)' : '')).join(', ');
  const facts = [
    slot === 'hello' ? 'It is his morning. Send a good-morning text.'
      : open.length ? `It is evening and he still has tasks left today. Send one nudge${one ? ' (he can tap Done or Tomorrow on your message)' : ''}.`
      : 'It is evening and he finished everything today. Cheer him on.',
    today.length ? `Today's tasks: ${names(today)}. Still to do: ${open.length ? names(open) : 'nothing'}.` : 'He has no tasks today.',
    away ? 'He has missed his tasks for 3 days in a row: ask how he is doing instead of bringing up tasks.'
      : ended ? `His ${ended}-day streak ended yesterday: comfort him.`
      : streak ? `He has finished everything ${streak} day(s) in a row.` : '',
    `His mood: ${mood ? ['very low', 'low', 'okay', 'good', 'great'][mood - 1] : 'unknown'}.`,
  ].filter(Boolean).join('\n');

  const fallback = slot === 'hello' ? `Morning 💜 ${open.length ? `${open.length} thing${open.length > 1 ? 's' : ''} on your list today. I'm rooting for you.` : 'Nothing on your list today, lucky you.'}`
    : open.length ? `You still have ${open[0].name}${open.length > 1 ? ` and ${open.length - 1} more` : ''} left 👀 now or tomorrow?` : 'You finished everything today! Proud of you 💜';
  let text = fallback;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ timeout: 12000, maxRetries: 0 }); // scheduled functions stop at 30 s
      const r = await client.messages.create({
        model: 'claude-haiku-4-5', max_tokens: 200,
        system: `${await gwenPersona()}\n\nRight now you are texting Rayan first: your message shows up as a notification from his DayTrack app, and he hasn't written to you. Write one text, at most 2 short sentences and 160 characters, no quotation marks, at most one emoji. Be playful and warm. Tease him gently only when his mood is good, great or unknown; be soft when it's low. Never guilt-trip him.`,
        messages: [{ role: 'user', content: facts }],
      });
      const out = r.content.filter(b => b.type === 'text').map(b => b.text).join('').trim().replace(/^["“]+|["”]+$/g, '');
      if (r.stop_reason !== 'refusal' && out) text = out.slice(0, 300);
    } catch (e) { console.error('Gwen check-in error:', e.status, e.message); }
  }
  return { text, taskId: one && one.id };
}

async function notify(webpush, subscription, body, notifStyle = 'default', taskId, title = '⏰ DayTrack') {
  try {
    console.log('Sending push:', body, 'style:', notifStyle);
    const payload = JSON.stringify({ title, body, notifStyle, taskId, gwen: title === '💜 Gwen' || undefined });
    // High urgency so Android delivers it right away, even with the screen off
    const result = await webpush.sendNotification(subscription, payload, { urgency: 'high' });
    console.log('Push sent, status:', result.statusCode);
  } catch (e) {
    console.error('Notify error:', e.statusCode, e.message, e.body);
    if (e.statusCode === 404 || e.statusCode === 410) subscription.gone = true; // the phone renews it on its next save
  }
}
export default lambda(handler);
