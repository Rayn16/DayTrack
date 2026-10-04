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
  let ctx = {};
  try { ctx = JSON.parse(Buffer.from(globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT || '', 'base64').toString()); } catch (_) {}
  if (!ctx.uncachedEdgeURL) console.warn('Blobs: no strong consistency available, using eventual');
  return getStore({ name, consistency: ctx.uncachedEdgeURL ? 'strong' : 'eventual' });
};
