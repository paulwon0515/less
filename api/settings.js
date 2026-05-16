import { kv } from '@vercel/kv';

const SETTINGS_KEY = 'lpss_settings';
const SIGNTYPES_KEY = 'lpss_signTypes';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const settings = await kv.get(SETTINGS_KEY);
      const signTypes = await kv.get(SIGNTYPES_KEY);
      return res.status(200).json({
        settings: settings || null,
        signTypes: signTypes || null,
      });
    }

    if (req.method === 'POST') {
      const { settings, signTypes } = req.body;
      if (settings) await kv.set(SETTINGS_KEY, settings);
      if (signTypes) await kv.set(SIGNTYPES_KEY, signTypes);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
