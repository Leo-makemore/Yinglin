// API endpoint for handling subscriptions using Supabase (PostgreSQL)
// This provides persistent storage with a proper database

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const TABLE_NAME = 'subscribers';

async function loadSubscribers() {
  if (!supabase) {
    console.error('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading subscribers:', error);
      return [];
    }

    return data.map(row => row.email);
  } catch (error) {
    console.error('Error loading subscribers:', error);
    return [];
  }
}

async function saveSubscriber(email) {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .insert({ 
        email: email.toLowerCase().trim(),
        created_at: new Date().toISOString()
      });

    if (error) {
      // If duplicate, that's okay
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return true; // Already exists
      }
      console.error('Error saving subscriber:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving subscriber:', error);
    return false;
  }
}

async function checkSubscriberExists(email) {
  if (!supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is okay
      console.error('Error checking subscriber:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking subscriber:', error);
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

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
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
      message: 'Thank you for your subscription!',
      total: subscribers.length
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

