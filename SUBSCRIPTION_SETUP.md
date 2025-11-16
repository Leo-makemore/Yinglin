# Subscription Feature Setup Guide

This guide explains how to set up and use the subscription feature for your website.

## Features

- **Subscribe Form**: Visitors can subscribe to receive email notifications when you update your website
- **Email Notifications**: Send updates to all subscribers with a simple command
- **Subscriber Management**: All subscribers are stored in `subscribers.json`

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install `nodemailer` for sending emails.

### 2. Set Up Email Service

You need to configure SMTP settings to send emails. You can use:
- **Gmail**: Use an App Password (recommended for personal use)
- **SendGrid**: Professional email service
- **Mailgun**: Another email service option
- **Any SMTP server**: Your own or your hosting provider's

#### For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

### 3. Environment Variables

Create a `.env` file (or set environment variables) with:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Yinglin Wang
WEBSITE_URL=https://your-website.com
```

**Important**: Add `.env` to `.gitignore` to keep your credentials safe!

### 4. Deploy API Endpoint

The subscription API needs to be accessible. You have several options:

#### Option A: Serverless Function (Recommended)

**For Vercel:**
1. Create `vercel.json`:
```json
{
  "functions": {
    "api/subscribe.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

2. Deploy to Vercel - the API will be available at `/api/subscribe`

**For Netlify:**
1. Create `netlify/functions/subscribe.js` (copy from `api/subscribe.js`)
2. Deploy to Netlify - the API will be available at `/.netlify/functions/subscribe`

#### Option B: Node.js Server

Run the API server locally or on a server:

```bash
node api/subscribe.js
```

The server will run on port 3001 (or PORT environment variable).

#### Option C: Use a Backend Service

You can also use services like:
- Firebase Functions
- AWS Lambda
- Google Cloud Functions

## Usage

### Subscribing

Visitors can subscribe by entering their email in the form on your homepage. The subscription is handled automatically.

### Sending Notifications

When you update your website and want to notify subscribers, run:

```bash
npm run notify "Subject" "Message"
```

Or directly:

```bash
node send-notification.js "Website Update" "I've added new projects and thoughts to my website!"
```

**Example:**

```bash
SMTP_HOST=smtp.gmail.com \
SMTP_PORT=587 \
SMTP_USER=your@gmail.com \
SMTP_PASS=your-app-password \
FROM_EMAIL=your@gmail.com \
FROM_NAME="Yinglin Wang" \
WEBSITE_URL=https://your-website.com \
node send-notification.js "New Update!" "Check out my latest projects and thoughts!"
```

### Viewing Subscribers

All subscribers are stored in `subscribers.json`. You can view them:

```bash
cat subscribers.json
```

## File Structure

```
.
├── api/
│   └── subscribe.js          # API endpoint for subscriptions
├── send-notification.js      # Script to send email notifications
├── subscribers.json          # List of all subscribers (auto-generated)
└── SUBSCRIPTION_SETUP.md     # This file
```

## Security Notes

1. **Never commit** `.env` or `subscribers.json` to git
2. Add to `.gitignore`:
   ```
   .env
   subscribers.json
   ```
3. Use environment variables for sensitive data
4. Consider rate limiting for the API endpoint
5. Add email validation and spam protection if needed

## Troubleshooting

### Emails not sending

1. Check SMTP credentials are correct
2. Verify firewall/network allows SMTP connections
3. For Gmail, ensure you're using an App Password, not your regular password
4. Check spam folder

### API endpoint not working

1. Verify the endpoint is deployed and accessible
2. Check CORS settings if calling from different domain
3. Verify the API route matches your deployment platform

### Subscribers not saving

1. Check file permissions for `subscribers.json`
2. Verify the API endpoint has write access
3. Check server logs for errors

## Future Enhancements

- Add unsubscribe functionality
- Email verification before subscribing
- Rate limiting
- Admin dashboard to view/manage subscribers
- Email templates
- Scheduled notifications
- Analytics on open rates

