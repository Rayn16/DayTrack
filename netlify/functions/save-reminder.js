const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { subscription, tasks } = JSON.parse(event.body);
    if (!subscription || !subscription.keys || !subscription.keys.auth) {
      return { statusCode: 400, body: 'Missing subscription' };
    }
    const key = subscription.keys.auth;
    const store = getStore({ name: 'daytrack', consistency: 'strong' });
    await store.setJSON(key, { subscription, tasks });
    return { statusCode: 200, body: '{"ok":true}', headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
