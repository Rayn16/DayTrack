import { lambda, blobStore } from '../lib/fn.mjs';

// The apps fetch the notifications waiting for them (?auth=<their id>), which empties the box
const handler = async (event) => {
  const auth = (event.queryStringParameters || {}).auth || '';
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(auth)) return { statusCode: 400, body: 'Bad id' };
  const box = blobStore('daytrack-outbox'), list = (await box.get(auth, { type: 'json' })) || [];
  if (list.length) await box.setJSON(auth, []);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(list) };
};

export default lambda(handler);
