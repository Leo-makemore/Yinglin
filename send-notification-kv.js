#!/usr/bin/env node

/**
 * Script to send email notifications to all subscribers from Vercel KV
 * 
 * Usage:
 *   node send-notification-kv.js "Subject" "Message body"
 */

require('dotenv').config();

const { kv } = require('@vercel/kv');
const nodemailer = require('nodemailer');

const SUBSCRIBERS_KEY = 'subscribers:list';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://your-website.com';

const subject = process.argv[2] || 'Website Update';
const message = process.argv[3] || 'I\'ve updated my website with new content! Check it out!';

async function loadSubscribers() {
  try {
    const subscribers = await kv.get(SUBSCRIBERS_KEY);
    return subscribers || [];
  } catch (error) {
    console.error('Error loading subscribers from KV:', error);
    process.exit(1);
  }
}

// Validate environment variables
function validateEnv() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }
}

// Send emails
async function sendNotifications() {
  validateEnv();
  
  const subscribers = await loadSubscribers();
  
  if (subscribers.length === 0) {
    console.log('No subscribers found.');
    return;
  }

  console.log(`Sending notifications to ${subscribers.length} subscribers...`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP server connection verified');
  } catch (error) {
    console.error('SMTP connection failed:', error);
    process.exit(1);
  }

  const fromName = process.env.FROM_NAME || 'Yinglin Wang';
  const fromEmail = process.env.FROM_EMAIL;

  // Email template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .message { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #8a1c1c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${subject}</h2>
        <div class="message">
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <a href="${WEBSITE_URL}" class="button">Visit Website</a>
        <div class="footer">
          <p>You're receiving this because you subscribed to updates from ${fromName}.</p>
          <p><a href="${WEBSITE_URL}">Visit my website</a> | <a href="mailto:${fromEmail}">Contact me</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
${subject}

${message}

Visit my website: ${WEBSITE_URL}

---
You're receiving this because you subscribed to updates from ${fromName}.
Visit: ${WEBSITE_URL}
Contact: ${fromEmail}
  `;

  // Send to all subscribers
  let successCount = 0;
  let failCount = 0;

  for (const email of subscribers) {
    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: subject,
        text: textTemplate,
        html: htmlTemplate,
      });

      console.log(`✓ Sent to ${email} (Message ID: ${info.messageId})`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to send to ${email}:`, error.message);
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n--- Summary ---');
  console.log(`Total subscribers: ${subscribers.length}`);
  console.log(`Successfully sent: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

// Run
sendNotifications().catch(error => {
  console.error('Error sending notifications:', error);
  process.exit(1);
});

