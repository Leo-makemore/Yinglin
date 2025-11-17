// API endpoint for handling subscriptions using Upstash Redis
// This provides persistent storage through Vercel Marketplace

const { Redis } = require('@upstash/redis');
const nodemailer = require('nodemailer');

// Initialize Redis client
// Vercel automatically creates these environment variables:
// - KV_REST_API_URL (or UPSTASH_REDIS_REST_URL)
// - KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN)
// - REDIS_URL (alternative format)
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
  
  // Try REDIS_URL (if it's in the format redis://...)
  if (process.env.REDIS_URL) {
    // REDIS_URL might be in format: redis://default:token@url:port
    // For @upstash/redis, we need REST API format
    // So we'll still need KV_REST_API_URL and KV_REST_API_TOKEN
    console.warn('REDIS_URL found but REST API URL/Token required');
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
const ADMIN_EMAIL = 'wangyinglin177@gmail.com';

// Send subscription notification emails
async function sendSubscriptionEmails(userEmail) {
  // Only load dotenv in local development (not needed on Vercel)
  if (process.env.VERCEL !== '1') {
    try {
      require('dotenv').config();
    } catch (e) {
      // dotenv not available, that's ok on Vercel
    }
  }
  
  // Check each variable individually
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('SMTP not configured, cannot send subscription emails');
    return { adminSent: false, userSent: false };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || '587'),
    secure: smtpPort === '465',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const websiteUrl = process.env.WEBSITE_URL || 'https://yinglin.vercel.app';
  const fromName = process.env.FROM_NAME || 'Yinglin Wang';
  const fromEmail = process.env.FROM_EMAIL || smtpUser;

  let adminSent = false;
  let userSent = false;

  // Send email to admin
  try {
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New Subscription</h2>
          <p>Someone has subscribed to your updates:</p>
          <div class="info-box">
            <strong>Email:</strong> ${userEmail}<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `;

    const adminResult = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: ADMIN_EMAIL,
      subject: `New Subscription: ${userEmail}`,
      html: adminHtml,
      text: `New subscription from ${userEmail}\nTime: ${new Date().toLocaleString()}`,
    });
    
    console.log(`Subscription notification sent to admin. MessageId: ${adminResult.messageId}`);
    adminSent = true;
  } catch (error) {
    console.error('Error sending subscription notification to admin:', error);
  }

  // Send confirmation email to user
  try {
    const userHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #8a1c1c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Thank You for Subscribing!</h2>
          <p>You have successfully subscribed to receive updates from my website.</p>
          <p>You will be notified whenever I post new content or updates.</p>
          <p>If you want to unsubscribe, you can do so at any time by visiting:</p>
          <a href="${websiteUrl}/unsubscribe.html" class="button">Unsubscribe</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you did not subscribe to this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const userResult = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject: 'Thank You for Subscribing!',
      html: userHtml,
      text: `Thank you for subscribing! You will receive updates from my website. To unsubscribe, visit: ${websiteUrl}/unsubscribe.html`,
    });
    
    console.log(`Subscription confirmation sent to user. MessageId: ${userResult.messageId}`);
    userSent = true;
  } catch (error) {
    console.error('Error sending subscription confirmation to user:', error);
  }

  return { adminSent, userSent };
}

async function loadSubscribers() {
  if (!redis) {
    console.error('Upstash Redis not configured. Available env vars:', 
      Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REDIS') || k.includes('UPSTASH')));
    return [];
  }

  try {
    const subscribers = await redis.get(SUBSCRIBERS_KEY);
    
    // Ensure we always return an array
    if (!subscribers) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(subscribers)) {
      return subscribers;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof subscribers === 'string') {
      try {
        const parsed = JSON.parse(subscribers);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse subscribers as JSON:', e);
        return [];
      }
    }
    
    // If it's an object, try to convert to array
    if (typeof subscribers === 'object') {
      console.warn('Subscribers is an object, converting to array');
      return Object.values(subscribers).filter(email => typeof email === 'string');
    }
    
    // Fallback: return empty array
    console.warn('Unexpected subscribers format:', typeof subscribers, subscribers);
    return [];
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

    let subscribers = await loadSubscribers();
    const normalizedEmail = email.toLowerCase().trim();

    // Double-check that subscribers is an array
    if (!Array.isArray(subscribers)) {
      console.error('Subscribers is not an array after loadSubscribers:', typeof subscribers, subscribers);
      subscribers = [];
    }

    if (subscribers.includes(normalizedEmail)) {
      return res.status(200).json({ message: 'You are already subscribed!' });
    }

    subscribers.push(normalizedEmail);
    const saved = await saveSubscribers(subscribers);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    // Send notification emails (wait for completion to ensure they're sent)
    try {
      const emailResult = await sendSubscriptionEmails(normalizedEmail);
      if (emailResult.adminSent) {
        console.log(`Subscription notification sent to admin for ${normalizedEmail}`);
      } else {
        console.error(`Failed to send subscription notification to admin for ${normalizedEmail}`);
      }
      if (emailResult.userSent) {
        console.log(`Subscription confirmation sent to user ${normalizedEmail}`);
      } else {
        console.error(`Failed to send subscription confirmation to user ${normalizedEmail}`);
      }
    } catch (error) {
      console.error('Error sending subscription emails:', error);
      // Don't fail the subscription if email fails, but log it
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

