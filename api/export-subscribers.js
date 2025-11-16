// API endpoint to export subscribers list from Upstash Redis
// This allows you to download the subscribers list from Vercel

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
  
  // Try Upstash default naming (user provided)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
  }
  
  // Debug: log available env vars
  const redisVars = Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
  );
  if (redisVars.length > 0) {
    console.log('Available Redis-related env vars:', redisVars);
  } else {
    console.log('No Redis-related env vars found');
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

// For Vercel serverless functions
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
    const subscribers = await loadSubscribers();

    // Return as JSON
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

