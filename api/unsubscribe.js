// API endpoint for handling unsubscriptions using Upstash Redis

const { Redis } = require('@upstash/redis');
const nodemailer = require('nodemailer');

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
const ADMIN_EMAIL = 'wangyinglin177@gmail.com';

// Send unsubscription notification emails
async function sendUnsubscriptionEmails(userEmail) {
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
    console.error('SMTP not configured, cannot send unsubscription emails');
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
          <h2>Subscription Cancelled</h2>
          <p>Someone has unsubscribed from your updates:</p>
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
      subject: `Unsubscription: ${userEmail}`,
      html: adminHtml,
      text: `Unsubscription from ${userEmail}\nTime: ${new Date().toLocaleString()}`,
    });
    
    console.log(`Unsubscription notification sent to admin. MessageId: ${adminResult.messageId}`);
    adminSent = true;
  } catch (error) {
    console.error('Error sending unsubscription notification to admin:', error);
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
          <h2>You Have Been Unsubscribed</h2>
          <p>You have successfully unsubscribed from our updates.</p>
          <p>We're sorry to see you go! If you change your mind, you can always subscribe again.</p>
          <a href="${websiteUrl}/index.html" class="button">Visit Website</a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you did not unsubscribe, please contact us.
          </p>
        </div>
      </body>
      </html>
    `;

    const userResult = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: userEmail,
      subject: 'You Have Been Unsubscribed',
      html: userHtml,
      text: `You have been unsubscribed from our updates. If you change your mind, you can subscribe again at ${websiteUrl}/index.html`,
    });
    
    console.log(`Unsubscription confirmation sent to user. MessageId: ${userResult.messageId}`);
    userSent = true;
  } catch (error) {
    console.error('Error sending unsubscription confirmation to user:', error);
  }

  return { adminSent, userSent };
}

async function loadSubscribers() {
  if (!redis) {
    console.error('Upstash Redis not configured');
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
    
    // Force subscribers to be an array - create a new array to ensure it's always valid
    if (!Array.isArray(subscribers)) {
      console.error('Subscribers is not an array after loadSubscribers:', typeof subscribers, subscribers);
      // Try to convert to array
      if (subscribers && typeof subscribers === 'object') {
        subscribers = Object.values(subscribers).filter(v => typeof v === 'string');
      } else {
        subscribers = [];
      }
    }
    
    // Create a new array to ensure it's mutable
    subscribers = [...subscribers];
    
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

    // Send notification emails (wait for completion to ensure they're sent)
    try {
      const emailResult = await sendUnsubscriptionEmails(normalizedEmail);
      if (emailResult.adminSent) {
        console.log(`Unsubscription notification sent to admin for ${normalizedEmail}`);
      } else {
        console.error(`Failed to send unsubscription notification to admin for ${normalizedEmail}`);
      }
      if (emailResult.userSent) {
        console.log(`Unsubscription confirmation sent to user ${normalizedEmail}`);
      } else {
        console.error(`Failed to send unsubscription confirmation to user ${normalizedEmail}`);
      }
    } catch (error) {
      console.error('Error sending unsubscription emails:', error);
      // Don't fail the unsubscription if email fails, but log it
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

