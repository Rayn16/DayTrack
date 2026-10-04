const { getStore } = require('@netlify/blobs');

// Done / Snooze tapped on a reminder notification
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { auth, taskId, action, date } = JSON.parse(event.body);
    if (!auth || !taskId || !['done', 'snooze'].includes(action) || (action === 'done' && !/^\d{4}-\d{2}-\d{2}$/.test(date || ''))) {
      return { statusCode: 400, body: 'Bad request' };
    }
    const { NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
    const store = getStore({ name: 'daytrack', consistency: 'strong', siteID: NETLIFY_SITE_ID, token: NETLIFY_AUTH_TOKEN });
    const data = await store.get(auth, { type: 'json' });
    const t = data && (data.tasks || []).find(x => x.id === taskId);
    if (!t) return { statusCode: 404, body: 'Unknown task' };
    if (action === 'done') t.done = [...new Set([...(t.done || []), date])];
    else t.snoozeUntil = Date.now() + 10 * 60000;
    await store.setJSON(auth, data);
    return { statusCode: 200, body: '{"ok":true}', headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    console.error('Action error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};
