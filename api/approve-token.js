// API endpoint to approve a token request and send token to user

const { Redis } = require('@upstash/redis');
const nodemailer = require('nodemailer');

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

const TOKENS_KEY = 'user_tokens:map';
const PENDING_REQUESTS_KEY = 'token_requests:pending';

// Generate a unique token
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Save user token
async function saveUserToken(email, token) {
  if (!redis) return false;
  
  try {
    const tokens = await redis.get(TOKENS_KEY) || {};
    tokens[email.toLowerCase().trim()] = token;
    await redis.set(TOKENS_KEY, tokens);
    return true;
  } catch (error) {
    console.error('Error saving user token:', error);
    return false;
  }
}

// Send token via email
async function sendTokenEmail(email, token) {
  require('dotenv').config();
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP not configured, cannot send email');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const websiteUrl = process.env.WEBSITE_URL || 'https://yinglin.vercel.app';
  const fromName = process.env.FROM_NAME || 'Yinglin Wang';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .token-box { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; }
        .button { display: inline-block; padding: 12px 24px; background: #8a1c1c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your Access Token Request Has Been Approved</h2>
        <p>Here is your personal access token for private content:</p>
        <div class="token-box">${token}</div>
        <p>Use this token to access private content on the website.</p>
        <a href="${websiteUrl}/thoughts.html" class="button">Access Private Content</a>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This token is unique to you. Keep it secure and don't share it with others.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Your Access Token Request Has Been Approved',
      html: htmlTemplate,
      text: `Your access token: ${token}\n\nUse this token to access private content at ${websiteUrl}/thoughts.html`,
    });
    return true;
  } catch (error) {
    console.error('Error sending token email:', error);
    return false;
  }
}

// For Vercel serverless functions
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!redis) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Get token from query parameter
    const approvalToken = req.query.token || req.body.token;

    if (!approvalToken) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2>Invalid Request</h2>
            <p>Missing approval token.</p>
          </body>
        </html>
      `);
    }

    // Get user email from approval token
    const approvalKey = `approval:${approvalToken}`;
    const normalizedEmail = await redis.get(approvalKey);

    if (!normalizedEmail) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2>Invalid or Expired Link</h2>
            <p>This approval link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    // Delete approval token (one-time use)
    await redis.del(approvalKey);

    // Remove from pending requests
    const pendingRequests = await redis.get(PENDING_REQUESTS_KEY) || [];
    const requestIndex = pendingRequests.findIndex(req => req.email === normalizedEmail);
    if (requestIndex !== -1) {
      pendingRequests.splice(requestIndex, 1);
      await redis.set(PENDING_REQUESTS_KEY, pendingRequests);
    }

    // Generate token
    const newToken = generateToken();
    const saved = await saveUserToken(normalizedEmail, newToken);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save token' });
    }

    // Send token via email
    const emailSent = await sendTokenEmail(normalizedEmail, newToken);

    // Send confirmation email to user
    if (emailSent) {
      return res.status(200).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2 style="color: #28a745;">✓ Request Approved</h2>
            <p>Token has been sent to <strong>${normalizedEmail}</strong></p>
            <p style="color: #666; margin-top: 30px;">You can close this page.</p>
          </body>
        </html>
      `);
    } else {
      return res.status(200).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2 style="color: #ffc107;">⚠ Request Approved</h2>
            <p>Token generated but email sending failed.</p>
            <p style="color: #666; margin-top: 30px;">Please check the server logs.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Approve token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

