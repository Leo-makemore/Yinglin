# Yinglin Wang - Personal Website

A retro-styled personal website inspired by jemdoc layout, featuring automatic content sync from Notion.

## 🚀 Live Site
[yinglin.vercel.app](https://yinglin.vercel.app)

## 📱 Mobile Content Publishing

This site automatically syncs **thoughts** and **gallery photos** from Notion databases every hour.

### Setup Instructions:

1. **Configure GitHub Secrets** (go to your repo → Settings → Secrets and variables → Actions):
   - `NOTION_TOKEN`: Your Notion integration token
   - `NOTION_DATABASE_ID`: Your Thoughts database ID
   - `NOTION_GALLERY_DATABASE_ID`: Your Gallery database ID

2. **Publish Thoughts** (手机发布想法):
   - Open the [Thoughts Database](https://www.notion.so/2acfd74deef680f3b622c65a88c42685) in Notion App
   - Add a new row with:
     - **Content**: Your thought/note
     - **Date**: Today (auto-filled)
   - Within 1 hour, it will appear on your website

3. **Publish Photos** (手机上传图片):
   - Open your Gallery Database in Notion App
   - Add a new row with:
     - **Image**: Upload photo(s) from your phone
     - **Caption**: Description of the photo
     - **Date**: Today (auto-filled)
   - Within 1 hour, photos will be downloaded and displayed on your website

4. **Manual sync** (optional):
   - Go to Actions tab in GitHub
   - Click "Sync Thoughts from Notion" or "Sync Gallery from Notion"
   - Click "Run workflow"

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Test Notion sync locally
export NOTION_TOKEN="your_notion_token"
export NOTION_DATABASE_ID="your_thoughts_database_id"
export NOTION_GALLERY_DATABASE_ID="your_gallery_database_id"

# Sync thoughts only
npm run sync

# Sync gallery only
npm run sync-gallery

# Sync both
npm run sync-all

# Preview changes
open thoughts.html
open gallery.html
```

## 📁 Project Structure

```
.
├── index.html              # Home page
├── experience.html         # Work experience
├── projects.html           # Projects showcase
├── gallery.html            # Photo gallery (auto-synced from Notion)
├── thoughts.html           # Thoughts (auto-synced from Notion)
├── reference.html          # References & links
├── styles.css              # Retro styling
├── sync-thoughts.js        # Notion thoughts sync script
├── sync-gallery.js         # Notion gallery sync script
├── assets/gallery/         # Downloaded gallery images
└── .github/workflows/      # Auto-sync automation
    ├── sync-thoughts.yml   # Thoughts sync workflow
    └── sync-gallery.yml    # Gallery sync workflow
```

## 🎨 Design Philosophy

- **Retro aesthetic**: Inspired by classic academic websites (jemdoc)
- **Content-first**: Minimal distractions, maximum readability
- **Mobile-friendly**: Write from anywhere, publish instantly

## 📝 License

Personal website © 2025 Yinglin Wang
