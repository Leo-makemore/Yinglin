# Yinglin Wang - Personal Website

A retro-styled personal website inspired by jemdoc layout, featuring automatic content sync from Notion.

## 🚀 Live Site
[yinglin.vercel.app](https://yinglin.vercel.app)

## 📱 Mobile Thoughts Publishing

This site automatically syncs thoughts from a Notion database every hour.

### Setup Instructions:

1. **Configure GitHub Secrets** (go to your repo → Settings → Secrets and variables → Actions):
   - `NOTION_TOKEN`: Your Notion integration token
   - `NOTION_DATABASE_ID`: Your Notion database ID

2. **Use Notion on your phone**:
   - Open the [Thoughts Database](https://www.notion.so/2acfd74deef680f3b622c65a88c42685)
   - Add a new row with:
     - **Content**: Your thought/note
     - **Date**: Today (auto-filled)
   - Within 1 hour, it will appear on your website

3. **Manual sync** (optional):
   - Go to Actions tab in GitHub
   - Click "Sync Thoughts from Notion"
   - Click "Run workflow"

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Test Notion sync locally
export NOTION_TOKEN="your_notion_token"
export NOTION_DATABASE_ID="your_database_id"
npm run sync

# Preview changes
open thoughts.html
```

## 📁 Project Structure

```
.
├── index.html          # Home page
├── experience.html     # Work experience
├── projects.html       # Projects showcase
├── gallery.html        # Photo gallery
├── thoughts.html       # Auto-synced thoughts from Notion
├── reference.html      # References & links
├── styles.css          # Retro styling
├── sync-thoughts.js    # Notion sync script
└── .github/workflows/  # Auto-sync automation
```

## 🎨 Design Philosophy

- **Retro aesthetic**: Inspired by classic academic websites (jemdoc)
- **Content-first**: Minimal distractions, maximum readability
- **Mobile-friendly**: Write from anywhere, publish instantly

## 📝 License

Personal website © 2025 Yinglin Wang
