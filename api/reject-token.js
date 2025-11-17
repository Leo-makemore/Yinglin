// API endpoint to reject a token request

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

const PENDING_REQUESTS_KEY = 'token_requests:pending';

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
            <p>This rejection link is invalid or has expired.</p>
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

    // Send rejection email to user
    // Only load dotenv in local development (not needed on Vercel)
    if (process.env.VERCEL !== '1') {
      try {
        require('dotenv').config();
      } catch (e) {
        // dotenv not available, that's ok on Vercel
      }
    }
    
    const nodemailer = require('nodemailer');
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromName = process.env.FROM_NAME || 'Yinglin Wang';
      const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: normalizedEmail,
        subject: 'Token Request Status',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
              <h2>Token Request Status</h2>
              <p>Your request for access token has been reviewed.</p>
              <p>Unfortunately, your request was not approved at this time.</p>
              <p>If you have any questions, please contact the administrator.</p>
            </body>
          </html>
        `,
        text: 'Your token request has been rejected. If you have any questions, please contact the administrator.',
      });
    }

    return res.status(200).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #dc3545;">✗ Request Rejected</h2>
          <p>Request from <strong>${normalizedEmail}</strong> has been rejected.</p>
          <p style="color: #666; margin-top: 30px;">You can close this page.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Reject token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

