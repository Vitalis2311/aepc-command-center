// Vercel Serverless Function — POST /api/verify-password
// Accepts: { password: string }
// Returns: 200 if matches, 401 otherwise.
//
// The team password is set via the SHARED_PASSWORD environment variable in
// the Vercel project settings. It is never exposed to the client.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const expected = process.env.SHARED_PASSWORD;

  if (!expected) {
    console.error('SHARED_PASSWORD env var not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  if (typeof password !== 'string' || password !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({ ok: true });
}
