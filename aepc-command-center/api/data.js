// Vercel Serverless Function — /api/data
// GET  /api/data?key=prospects    → returns the value stored under that key
// POST /api/data                   → body: { key, value } stores the value
//
// Uses the Vercel-Marketplace Redis store (Upstash) via the standard `redis`
// client over `REDIS_URL`. The connection is cached on the module level so
// warm invocations of the function reuse it.

import { createClient } from 'redis';

const ALLOWED_KEYS = new Set([
  'aepc:prospects',
  'aepc:activities',
  'aepc:leads',
  'aepc:events',
  'aepc:monthlyGoal',
  'aepc:eiosConfig'
]);

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis client error:', err));
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

export default async function handler(req, res) {
  const provided = req.headers['x-aepc-pass'];
  if (!process.env.SHARED_PASSWORD || provided !== process.env.SHARED_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.REDIS_URL) {
    return res.status(500).json({ error: 'Storage not configured' });
  }

  try {
    const client = await getClient();

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!ALLOWED_KEYS.has(key)) {
        return res.status(400).json({ error: 'Invalid key' });
      }
      const raw = await client.get(key);
      const value = raw ? JSON.parse(raw) : null;
      return res.status(200).json({ key, value });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!ALLOWED_KEYS.has(key)) {
        return res.status(400).json({ error: 'Invalid key' });
      }
      await client.set(key, JSON.stringify(value));
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Storage error:', err);
    return res.status(500).json({ error: 'Storage error' });
  }
}
