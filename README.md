# Personal Website

Personal website with subscription functionality and Notion integration.

## Features

- Personal portfolio website
- Subscription system with email notifications
- Notion-powered thoughts and gallery sync
- Responsive design

## Setup

### Environment Variables

Create a `.env` file with:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Your Name
WEBSITE_URL=https://your-domain.vercel.app
```

**Gmail App Password Setup:**
1. Enable 2-Step Verification in Google Account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password (without spaces) as `SMTP_PASS`

### Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST Token

Or use Vercel's auto-created variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Scripts

```bash
# Sync thoughts from Notion
npm run sync

# Sync gallery from Notion
npm run sync-gallery

# Sync both
npm run sync-all

# Send email notifications to subscribers
npm run notify "Subject" "Message"

# Fetch subscribers from Vercel
npm run fetch-subscribers
```

## Project Structure

```
.
├── api/
│   ├── subscribe.js          # Subscribe API endpoint
│   ├── unsubscribe.js        # Unsubscribe API endpoint
│   └── export-subscribers.js # Export subscribers API
├── assets/                    # Images and icons
├── *.html                     # Website pages
├── styles.css                 # Styles
├── send-notification.js       # Email notification script
├── fetch-subscribers.js      # Fetch subscribers script
└── vercel.json               # Vercel configuration
```

## Deployment

Deploy to Vercel:

```bash
git push
```

Vercel will automatically deploy. Make sure environment variables are set in Vercel Dashboard.
