import { lambda, blobStore } from '../lib/fn.mjs';
import { keyOk } from '../lib/house.mjs';

// Everything DayTrack keeps, as one file: synced data and chats, reminders/Gwen state, Gwen's notes, the house's parcels and postcards
const STORES = ['daytrack-sync', 'daytrack', 'daytrack-gwen', 'daytrack-house'];
export async function dump() {
  const out = { at: new Date().toISOString() };
  for (const name of STORES) {
    const s = blobStore(name), { blobs } = await s.list();
    out[name] = {};
    for (const { key } of blobs) out[name][key] = await s.get(key, { type: 'json' });
  }
  return out;
}

const handler = async (event) => {
  if (!keyOk((event.queryStringParameters || {}).key)) return { statusCode: 401, body: 'Wrong key' };
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(await dump()) };
};
export default lambda(handler);
