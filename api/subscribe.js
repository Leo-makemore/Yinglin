// API endpoint for handling subscriptions
// This can be deployed as a serverless function (Vercel/Netlify) or used with a Node.js server

const fs = require('fs');
const path = require('path');

// For Vercel: file system is read-only, use /tmp for temporary storage
// Note: /tmp is ephemeral and will be lost between deployments
// For production, consider using Vercel KV, a database, or external storage
const IS_VERCEL = process.env.VERCEL === '1';
const SUBSCRIBERS_FILE = IS_VERCEL 
  ? '/tmp/subscribers.json'
  : path.join(__dirname, '..', 'subscribers.json');

// Initialize subscribers file if it doesn't exist
function initSubscribersFile() {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([], null, 2));
    }
  } catch (error) {
    // If we can't write (e.g., Vercel), that's okay - we'll use in-memory storage
    console.warn('Could not initialize subscribers file:', error.message);
  }
}

// Try to initialize on load (may fail on Vercel)
if (!IS_VERCEL) {
  initSubscribersFile();
}

// In-memory storage as fallback (for Vercel or when file system is not available)
let inMemorySubscribers = [];

function loadSubscribers() {
  // Try to load from file first
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const subscribers = JSON.parse(data);
      // Sync with in-memory storage
      inMemorySubscribers = subscribers;
      return subscribers;
    }
  } catch (error) {
    console.warn('Could not load from file, using in-memory storage:', error.message);
  }
  
  // Fallback to in-memory storage
  return inMemorySubscribers;
}

function saveSubscribers(subscribers) {
  // Update in-memory storage
  inMemorySubscribers = subscribers;
  
  // Try to save to file
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
  } catch (error) {
    // If we can't write (e.g., Vercel), that's okay - we'll use in-memory storage
    console.warn('Could not save to file, using in-memory storage:', error.message);
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

    const subscribers = loadSubscribers();
    const normalizedEmail = email.toLowerCase().trim();

    if (subscribers.includes(normalizedEmail)) {
      return res.status(200).json({ message: 'You are already subscribed!' });
    }

    subscribers.push(normalizedEmail);
    saveSubscribers(subscribers);

    return res.status(200).json({ 
      message: 'Successfully subscribed!',
      total: subscribers.length
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// For direct Node.js usage
if (require.main === module) {
  const http = require('http');
  const url = require('url');

  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/subscribe' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const { email } = JSON.parse(body);
          const handler = module.exports;
          handler({ method: 'POST', body: { email } }, {
            setHeader: (name, value) => res.setHeader(name, value),
            status: (code) => ({ json: (data) => {
              res.statusCode = code;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }})
          });
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Subscription API server running on port ${PORT}`);
  });
}

