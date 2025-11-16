// API endpoint for handling subscriptions using Vercel KV (Redis)
// This provides persistent storage that won't be lost on deployments

const { kv } = require('@vercel/kv');

const SUBSCRIBERS_KEY = 'subscribers:list';

async function loadSubscribers() {
  try {
    const subscribers = await kv.get(SUBSCRIBERS_KEY);
    return subscribers || [];
  } catch (error) {
    console.error('Error loading subscribers from KV:', error);
    return [];
  }
}

async function saveSubscribers(subscribers) {
  try {
    await kv.set(SUBSCRIBERS_KEY, subscribers);
    return true;
  } catch (error) {
    console.error('Error saving subscribers to KV:', error);
    return false;
  }
}

// For Vercel serverless functions
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const subscribers = await loadSubscribers();
    const normalizedEmail = email.toLowerCase().trim();

    if (subscribers.includes(normalizedEmail)) {
      return res.status(200).json({ message: 'You are already subscribed!' });
    }

    subscribers.push(normalizedEmail);
    const saved = await saveSubscribers(subscribers);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    return res.status(200).json({ 
      message: 'Thank you for your subscription!',
      total: subscribers.length
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

