import { Redis } from '@upstash/redis';

let redis;
try {
  // Try standard Upstash env vars first
  if (process.env.UPSTASH_REDIS_REST_URL) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  // Fallback to KV-style env vars (Vercel marketplace naming)
  else if (process.env.KV_REST_API_URL) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch (e) {
  console.error('Redis init failed:', e);
}

const SETTINGS_KEY = 'lpss_settings';
const SIGNTYPES_KEY = 'lpss_signTypes';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Debug: check if Redis is connected
  if (!redis) {
    const envKeys = Object.keys(process.env).filter(k =>
      k.includes('UPSTASH') || k.includes('KV') || k.includes('REDIS')
    );
    return res.status(500).json({
      error: 'Redis not initialized',
      availableEnvKeys: envKeys,
    });
  }

  try {
    if (req.method === 'GET') {
      const [settings, signTypes] = await Promise.all([
        redis.get(SETTINGS_KEY),
        redis.get(SIGNTYPES_KEY),
      ]);
      return res.status(200).json({
        settings: settings || null,
        signTypes: signTypes || null,
      });
    }

    if (req.method === 'POST') {
      const { settings, signTypes } = req.body;
      const promises = [];
      if (settings) promises.push(redis.set(SETTINGS_KEY, settings));
      if (signTypes) promises.push(redis.set(SIGNTYPES_KEY, signTypes));
      await Promise.all(promises);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
