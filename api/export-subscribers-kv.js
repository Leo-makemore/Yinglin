// API endpoint to export subscribers list from Vercel KV

const { kv } = require('@vercel/kv');

const SUBSCRIBERS_KEY = 'subscribers:list';

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const subscribers = await kv.get(SUBSCRIBERS_KEY) || [];

    return res.status(200).json({
      subscribers: subscribers,
      count: subscribers.length,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

