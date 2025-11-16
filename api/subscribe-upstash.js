// API endpoint for handling subscriptions using Upstash Redis
// This provides persistent storage through Vercel Marketplace

const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const SUBSCRIBERS_KEY = 'subscribers:list';

async function loadSubscribers() {
  if (!redis) {
    console.error('Upstash Redis not configured');
    return [];
  }

  try {
    const subscribers = await redis.get(SUBSCRIBERS_KEY);
    return subscribers || [];
  } catch (error) {
    console.error('Error loading subscribers from Redis:', error);
    return [];
  }
}

async function saveSubscribers(subscribers) {
  if (!redis) {
    console.error('Upstash Redis not configured');
    return false;
  }

  try {
    await redis.set(SUBSCRIBERS_KEY, subscribers);
    return true;
  } catch (error) {
    console.error('Error saving subscribers to Redis:', error);
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

  if (!redis) {
    return res.status(500).json({ error: 'Database not configured' });
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

