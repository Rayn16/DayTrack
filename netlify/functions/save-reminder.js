const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
    const { subscription, tasks } = JSON.parse(event.body);
    if (!subscription || !subscription.keys || !subscription.keys.auth) {
      console.log('Missing subscription or keys');
      return { statusCode: 400, body: 'Missing subscription' };
    }
    const key = subscription.keys.auth;
    const store = getStore({ name: 'daytrack', consistency: 'strong', siteID: NETLIFY_SITE_ID, token: NETLIFY_AUTH_TOKEN });
    await store.setJSON(key, { subscription, tasks });
    console.log(`Saved subscription key=${key.slice(0,8)}... tasks=${tasks.length}`);
    return { statusCode: 200, body: '{"ok":true}', headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    console.error('Error:', e.message);
    return { statusCode: 500, body: e.message };
  }
};
