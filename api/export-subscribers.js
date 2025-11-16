// API endpoint to export subscribers list
// This allows you to download the subscribers list from Vercel

const fs = require('fs');
const path = require('path');

// For Vercel: file system is read-only, use /tmp for temporary storage
const IS_VERCEL = process.env.VERCEL === '1';
const SUBSCRIBERS_FILE = IS_VERCEL 
  ? '/tmp/subscribers.json'
  : path.join(__dirname, '..', 'subscribers.json');

// In-memory storage (for Vercel)
let inMemorySubscribers = [];

function loadSubscribers() {
  // Try to load from file first
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const subscribers = JSON.parse(data);
      inMemorySubscribers = subscribers;
      return subscribers;
    }
  } catch (error) {
    console.warn('Could not load from file:', error.message);
  }
  
  // Fallback to in-memory storage
  return inMemorySubscribers;
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
    const subscribers = loadSubscribers();

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

