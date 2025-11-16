// API endpoint for handling unsubscriptions using Upstash Redis

const { Redis } = require('@upstash/redis');

// Initialize Redis client
function getRedisConfig() {
  // Try Vercel's default naming first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  
  // Try Upstash default naming
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  
  return null;
}

const config = getRedisConfig();
const redis = config
  ? new Redis({
      url: config.url,
      token: config.token,
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
    const index = subscribers.indexOf(normalizedEmail);

    if (index === -1) {
      return res.status(200).json({ 
        message: 'This email is not in our subscription list.',
        alreadyUnsubscribed: true
      });
    }

    // Remove the email from the list
    subscribers.splice(index, 1);
    const saved = await saveSubscribers(subscribers);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to unsubscribe' });
    }

    return res.status(200).json({ 
      message: 'You have been successfully unsubscribed. We\'re sorry to see you go!',
      total: subscribers.length
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

