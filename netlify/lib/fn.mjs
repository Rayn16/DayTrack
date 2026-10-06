import { getStore } from '@netlify/blobs';

// Modern (v2) Netlify functions get Blobs access from the platform, so no NETLIFY_AUTH_TOKEN
// is needed. This runs the old (event) => { statusCode, headers, body } handlers in that shape.
export const lambda = (handler) => async (req) => {
  const r = (await handler({
    httpMethod: req.method,
    queryStringParameters: Object.fromEntries(new URL(req.url).searchParams),
    body: req.method === 'GET' || req.method === 'HEAD' ? null : await req.text(),
  })) || {};
  return new Response(r.body ?? null, { status: r.statusCode || 200, headers: r.headers });
};

// Strong reads stop reminders firing twice; fall back to eventual if the platform doesn't offer them
export const blobStore = (name) => {
  if (globalThis.dtStore) return globalThis.dtStore(name); // DayTrack.exe keeps them in files on the PC
  let ctx = {};
  try { ctx = JSON.parse(Buffer.from(globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT || '', 'base64').toString()); } catch (_) {}
  if (!ctx.uncachedEdgeURL) console.warn('Blobs: no strong consistency available, using eventual');
  return getStore({ name, consistency: ctx.uncachedEdgeURL ? 'strong' : 'eventual' });
};

// The phone and desktop apps have no web push: their notifications wait here until the app fetches them
export const isNative = (sub) => typeof (sub && sub.endpoint) === 'string' && sub.endpoint.startsWith('native:');
export async function queueNative(sub, msg) {
  const box = blobStore('daytrack-outbox'), key = sub.keys.auth;
  const list = (await box.get(key, { type: 'json' })) || [];
  await box.setJSON(key, [...list, { ...msg, at: Date.now() }].slice(-30));
}
