// API endpoint to verify access token
// This provides simple token-based authentication for private content

const { Redis } = require('@upstash/redis');

// Initialize Redis client
function getRedisConfig() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  
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

const TOKENS_KEY = 'user_tokens:map'; // email -> token mapping

// Check if token is valid (check against all user tokens)
async function isTokenValid(token) {
  if (!redis) {
    return false;
  }

  try {
    const tokens = await redis.get(TOKENS_KEY) || {};
    // Check if token exists in any user's token
    return Object.values(tokens).includes(token);
  } catch (error) {
    console.error('Error checking token:', error);
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
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const isValid = await isTokenValid(token);

    if (isValid) {
      return res.status(200).json({ 
        valid: true,
        message: 'Token is valid'
      });
    } else {
      return res.status(401).json({ 
        valid: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

