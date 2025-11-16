// API endpoint for handling subscriptions using Neon Postgres
// This provides persistent storage through Vercel Marketplace

const { neon } = require('@neondatabase/serverless');

// Initialize Neon client
const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;

async function initDatabase() {
  if (!sql) return false;

  try {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email)
    `;
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

async function loadSubscribers() {
  if (!sql) {
    console.error('Neon database not configured');
    return [];
  }

  try {
    const result = await sql`
      SELECT email FROM subscribers ORDER BY created_at DESC
    `;
    return result.map(row => row.email);
  } catch (error) {
    console.error('Error loading subscribers:', error);
    return [];
  }
}

async function saveSubscriber(email) {
  if (!sql) {
    console.error('Neon database not configured');
    return false;
  }

  try {
    await sql`
      INSERT INTO subscribers (email) 
      VALUES (${email.toLowerCase().trim()})
      ON CONFLICT (email) DO NOTHING
    `;
    return true;
  } catch (error) {
    // If duplicate, that's okay (handled by ON CONFLICT)
    if (error.code === '23505') {
      return true;
    }
    console.error('Error saving subscriber:', error);
    return false;
  }
}

async function checkSubscriberExists(email) {
  if (!sql) {
    return false;
  }

  try {
    const result = await sql`
      SELECT email FROM subscribers WHERE email = ${email.toLowerCase().trim()}
    `;
    return result.length > 0;
  } catch (error) {
    console.error('Error checking subscriber:', error);
    return false;
  }
}

// Initialize database on first load
let dbInitialized = false;

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

  if (!sql) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  // Initialize database on first request
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await checkSubscriberExists(normalizedEmail);

    if (exists) {
      return res.status(200).json({ message: 'You are already subscribed!' });
    }

    const saved = await saveSubscriber(normalizedEmail);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    const subscribers = await loadSubscribers();

    return res.status(200).json({ 
      message: 'Successfully subscribed!',
      total: subscribers.length
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

