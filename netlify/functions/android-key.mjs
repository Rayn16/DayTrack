import crypto from 'node:crypto';

// The Android build's signing key password, only for GitHub Actions runs on Rayn16/DayTrack's main
// branch. The run proves who it is with a GitHub OIDC token; the encrypted key is in android/.
const ISS = 'https://token.actions.githubusercontent.com';

export default async (req) => {
  const deny = (s) => new Response('no', { status: s });
  const { ANDROID_KEY } = process.env;
  if (req.method !== 'POST' || !ANDROID_KEY) return deny(404);
  const [h, p, sig] = (req.headers.get('authorization') || '').replace(/^Bearer /, '').split('.');
  if (!sig) return deny(401);
  try {
    const head = JSON.parse(Buffer.from(h, 'base64url')), claims = JSON.parse(Buffer.from(p, 'base64url'));
    const { keys } = await (await fetch(ISS + '/.well-known/jwks')).json();
    const jwk = keys.find(k => k.kid === head.kid);
    const valid = head.alg === 'RS256' && jwk &&
      crypto.verify('RSA-SHA256', Buffer.from(h + '.' + p), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(sig, 'base64url'));
    if (!valid || claims.iss !== ISS || claims.aud !== 'yasuomain' || claims.exp * 1000 < Date.now() ||
        claims.repository !== 'Rayn16/DayTrack' || claims.ref !== 'refs/heads/main') return deny(403);
    return new Response(ANDROID_KEY);
  } catch (e) {
    return deny(401);
  }
};
