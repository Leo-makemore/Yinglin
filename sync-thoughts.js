const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

async function syncThoughts() {
  try {
    // 从 Notion 获取所有条目，按日期倒序
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }]
    });

    // 生成 thoughts 内容
    const thoughtsHtml = response.results.map(page => {
      const content = page.properties.Content?.rich_text?.[0]?.plain_text || '';
      const date = page.properties.Date?.date?.start || '';
      
      if (!content) return '';
      
      return `          <hr>
          <p>${content}</p>
          <p class="timestamp">${new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>`;
    }).filter(Boolean).join('\n');

    // 读取 thoughts.html 模板
    let template = fs.readFileSync('thoughts.html', 'utf8');
    
    // 找到插入点并替换内容
    const startMarker = '<!-- THOUGHTS_START -->';
    const endMarker = '<!-- THOUGHTS_END -->';
    const startIndex = template.indexOf(startMarker);
    const endIndex = template.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Markers not found in thoughts.html');
      process.exit(1);
    }
    
    const before = template.substring(0, startIndex + startMarker.length);
    const after = template.substring(endIndex);
    
    const updated = before + '\n' + thoughtsHtml + '\n        ' + after;
    
    // 写回文件
    fs.writeFileSync('thoughts.html', updated);
    console.log(`✓ Synced ${response.results.length} thoughts from Notion`);
    
  } catch (error) {
    console.error('Error syncing thoughts:', error);
    process.exit(1);
  }
}

syncThoughts();

