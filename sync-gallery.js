const { Client } = require('@notionhq/client');
const fs = require('fs');
const https = require('https');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const galleryDatabaseId = process.env.NOTION_GALLERY_DATABASE_ID;

// 下载图片到本地
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function syncGallery() {
  try {
    // 从 Notion 获取所有图片，按日期倒序
    const response = await notion.databases.query({
      database_id: galleryDatabaseId,
      sorts: [{ property: 'Date', direction: 'descending' }]
    });

    // 确保 assets/gallery 目录存在
    const galleryDir = path.join(__dirname, 'assets', 'gallery');
    if (!fs.existsSync(galleryDir)) {
      fs.mkdirSync(galleryDir, { recursive: true });
    }

    // 处理每张图片
    const galleryHtml = [];
    let downloadCount = 0;

    for (const page of response.results) {
      const caption = page.properties.Caption?.rich_text?.[0]?.plain_text || '';
      const files = page.properties.Image?.files || [];
      
      if (files.length === 0 || !caption) continue;

      // 获取图片 URL（支持 Notion 上传的文件和外部链接）
      const imageFile = files[0];
      let imageUrl;
      
      if (imageFile.type === 'file') {
        imageUrl = imageFile.file.url;
      } else if (imageFile.type === 'external') {
        imageUrl = imageFile.external.url;
      } else {
        continue;
      }

      // 生成本地文件名（使用 page ID 的前 8 位 + 原始扩展名）
      const pageId = page.id.replace(/-/g, '').substring(0, 8);
      const ext = path.extname(imageUrl.split('?')[0]) || '.jpg';
      const filename = `${pageId}${ext}`;
      const localPath = path.join(galleryDir, filename);
      const relativePath = `assets/gallery/${filename}`;

      // 下载图片（如果还不存在）
      if (!fs.existsSync(localPath)) {
        try {
          await downloadImage(imageUrl, localPath);
          downloadCount++;
          console.log(`✓ Downloaded: ${filename}`);
        } catch (error) {
          console.error(`✗ Failed to download ${filename}:`, error.message);
          continue;
        }
      }

      // 生成 HTML
      galleryHtml.push(`            <figure>
              <img src="${relativePath}" alt="${caption}" />
              <figcaption>${caption}</figcaption>
            </figure>`);
    }

    // 读取 gallery.html 模板
    let template = fs.readFileSync('gallery.html', 'utf8');
    
    // 找到插入点并替换内容
    const startMarker = '<!-- GALLERY_START -->';
    const endMarker = '<!-- GALLERY_END -->';
    const startIndex = template.indexOf(startMarker);
    const endIndex = template.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Markers not found in gallery.html');
      process.exit(1);
    }
    
    const before = template.substring(0, startIndex + startMarker.length);
    const after = template.substring(endIndex);
    
    const updated = before + '\n' + galleryHtml.join('\n') + '\n        ' + after;
    
    // 写回文件
    fs.writeFileSync('gallery.html', updated);
    console.log(`✓ Synced ${response.results.length} images from Notion (${downloadCount} new downloads)`);
    
  } catch (error) {
    console.error('Error syncing gallery:', error);
    process.exit(1);
  }
}

syncGallery();

