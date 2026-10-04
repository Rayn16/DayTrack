const { getStore } = require('@netlify/blobs');

// Whole DayTrack data set per private sync code (32 hex chars made on the phone)
const CODE = /^[a-f0-9]{32}$/;

exports.handler = async (event) => {
  const { NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
  const store = getStore({ name: 'daytrack-sync', consistency: 'strong', siteID: NETLIFY_SITE_ID, token: NETLIFY_AUTH_TOKEN });
  try {
    if (event.httpMethod === 'GET') {
      const code = (event.queryStringParameters || {}).code || '';
      if (!CODE.test(code)) return { statusCode: 400, body: 'Bad code' };
      return json(await store.get(code, { type: 'json' }));
    }
    if (event.httpMethod === 'POST') {
      const { code, data } = JSON.parse(event.body);
      if (!CODE.test(code || '') || !data || typeof data.updatedAt !== 'number') return { statusCode: 400, body: 'Bad request' };
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
