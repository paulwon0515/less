import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const SETTINGS_KEY = 'lpss_settings';
const SIGNTYPES_KEY = 'lpss_signTypes';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      if (settings) promises.push(redis.set(SETTINGS_KEY, JSON.stringify(settings)));
      if (signTypes) promises.push(redis.set(SIGNTYPES_KEY, JSON.stringify(signTypes)));
      await Promise.all(promises);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Redis Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
