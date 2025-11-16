// Netlify serverless function for subscriptions
// This file should be placed in netlify/functions/subscribe.js

const fs = require('fs');
const path = require('path');

// For Netlify, we'll use a different storage approach
// You might want to use a database or external storage service
const SUBSCRIBERS_FILE = '/tmp/subscribers.json';

// In production, consider using:
// - Netlify's built-in storage
// - A database (MongoDB, PostgreSQL, etc.)
// - External storage service

function loadSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading subscribers:', error);
    return [];
  }
}

function saveSubscribers(subscribers) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
  } catch (error) {
    console.error('Error saving subscribers:', error);
  }
}

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email is required' }),
      };
    }

    const subscribers = loadSubscribers();
    const normalizedEmail = email.toLowerCase().trim();

    if (subscribers.includes(normalizedEmail)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'You are already subscribed!' }),
      };
    }

    subscribers.push(normalizedEmail);
    saveSubscribers(subscribers);

    // TODO: In production, save to a database or external storage
    // For now, this uses /tmp which is ephemeral on Netlify

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Successfully subscribed!',
        total: subscribers.length,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

