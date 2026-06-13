const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  try {
    const { playerId, tasks } = JSON.parse(event.body);
    if (!playerId) return { statusCode: 400, body: 'Missing playerId' };
    const store = getStore({ name: 'daytrack', consistency: 'strong' });
    await store.setJSON(playerId, tasks);
    return { statusCode: 200, body: '{"ok":true}', headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
