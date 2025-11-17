// API endpoint to request a new access token
// Users can request a token by providing their email

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

const TOKENS_KEY = 'user_tokens:map'; // email -> token mapping
const PENDING_REQUESTS_KEY = 'token_requests:pending'; // list of pending requests
const ADMIN_EMAIL = 'wangyinglin177@gmail.com';

// Generate a unique token
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get user token by email
async function getUserToken(email) {
  if (!redis) return null;
  
  try {
    const tokens = await redis.get(TOKENS_KEY) || {};
    return tokens[email.toLowerCase().trim()] || null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
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

// Send approval request email to admin
async function sendApprovalRequestEmail(userEmail) {
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

  if (!redis) {
    console.error('Redis not configured, cannot send approval request');
    return false;
  }

  // Generate approval token (simple hash of email + timestamp)
  const crypto = require('crypto');
  const approvalToken = crypto.createHash('sha256')
    .update(userEmail + Date.now() + (process.env.ADMIN_SECRET || 'secret'))
    .digest('hex')
    .substring(0, 32);

  // Save approval token with user email
  const approvalKey = `approval:${approvalToken}`;
  await redis.set(approvalKey, userEmail, { ex: 86400 }); // Expire in 24 hours

  const approveUrl = `${websiteUrl}/api/approve-token?token=${approvalToken}`;
  const rejectUrl = `${websiteUrl}/api/reject-token?token=${approvalToken}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .button-approve { background: #28a745; color: white; }
        .button-reject { background: #dc3545; color: white; }
        .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Token Request Approval</h2>
        <p>Someone has requested access to private content:</p>
        <div class="info-box">
          <strong>Email:</strong> ${userEmail}<br>
          <strong>Time:</strong> ${new Date().toLocaleString()}
        </div>
        <p>Click below to approve or reject:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveUrl}" class="button button-approve">✓ Approve</a>
          <a href="${rejectUrl}" class="button button-reject">✗ Reject</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: ADMIN_EMAIL,
      subject: `Token Request from ${userEmail}`,
      html: htmlTemplate,
      text: `Token request from ${userEmail}\n\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
    });
    return true;
  } catch (error) {
    console.error('Error sending approval request email:', error);
    return false;
  }
}

// Send token via email
async function sendTokenEmail(email, token) {
  // Load environment variables
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
        <h2>Your Access Token</h2>
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
      subject: 'Your Access Token for Private Content',
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

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already has a token
    const existingToken = await getUserToken(normalizedEmail);
    
    if (existingToken) {
      // User already has a token, don't generate a new one
      return res.status(400).json({ 
        error: 'You already have a token. Please use your existing token to access. If you lost it, contact the administrator.',
        has_existing_token: true
      });
    }

    // Check if there's already a pending request for this email
    const pendingRequests = await redis.get(PENDING_REQUESTS_KEY) || [];
    const hasPendingRequest = pendingRequests.some(req => req.email === normalizedEmail);
    
    if (hasPendingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending request. Please wait for approval.',
        has_pending_request: true
      });
    }

    // Add request to pending list
    const request = {
      email: normalizedEmail,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    pendingRequests.push(request);
    await redis.set(PENDING_REQUESTS_KEY, pendingRequests);

    // Send approval request email to admin
    const emailSent = await sendApprovalRequestEmail(normalizedEmail);

    if (!emailSent) {
      console.error('Failed to send approval request email');
      // Still return success to user, but log the error
    }

    // Return success message (token will be sent after approval)
    return res.status(200).json({ 
      message: 'Your request has been submitted. You will receive an email with your access token once approved.',
      pending: true
    });
  } catch (error) {
    console.error('Token request error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

