# 部署指南 (Deployment Guide)

## 部署前检查清单

### ✅ 1. 代码准备
- [x] 所有 HTML 文件已更新
- [x] API 端点已创建 (`api/subscribe.js`)
- [x] 配置文件已准备 (`vercel.json`)
- [x] `.gitignore` 已配置（保护敏感文件）

### ⚠️ 2. 重要注意事项

**Vercel Serverless 函数限制：**
- Vercel 的文件系统是**只读**的，不能写入文件
- `subscribers.json` 在 Vercel 上无法持久化存储
- 当前实现使用 `/tmp` 目录（临时存储，部署后会丢失）

**解决方案选项：**

#### 选项 A: 使用 Vercel KV (推荐)
Vercel KV 是基于 Redis 的键值存储，适合存储订阅者列表。

1. 在 Vercel 项目中启用 KV
2. 安装依赖：`npm install @vercel/kv`
3. 更新 `api/subscribe.js` 使用 KV 存储

#### 选项 B: 使用外部数据库
- MongoDB Atlas (免费层可用)
- Supabase (PostgreSQL)
- Firebase Realtime Database

#### 选项 C: 使用第三方服务
- Mailchimp (邮件营销服务，自带订阅管理)
- ConvertKit
- Buttondown

#### 选项 D: 当前实现（临时方案）
- 使用内存存储 + `/tmp` 文件
- **注意**：数据在部署后会丢失
- 适合测试或小规模使用

### 3. 环境变量配置

在 Vercel 部署时，需要在 Vercel Dashboard 中设置环境变量：

1. 进入 Vercel 项目设置
2. 找到 "Environment Variables"
3. 添加以下变量：

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Yinglin Wang
WEBSITE_URL=https://your-domain.vercel.app
```

**重要**：不要在代码中硬编码这些值！

### 4. 部署步骤

#### 使用 Vercel CLI:

```bash
# 安装 Vercel CLI (如果还没有)
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

#### 使用 GitHub 集成:

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动部署

### 5. 部署后测试

1. **测试订阅功能**：
   - 访问你的网站
   - 尝试订阅
   - 检查是否成功

2. **测试 API 端点**：
   ```bash
   curl -X POST https://your-domain.vercel.app/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

3. **测试邮件发送**（本地）：
   ```bash
   npm run notify "Test" "This is a test"
   ```

### 6. 当前限制

⚠️ **重要**：当前实现有以下限制：

1. **数据持久化**：在 Vercel 上，订阅者数据存储在 `/tmp`，部署后会丢失
2. **多实例**：如果有多个 serverless 函数实例，数据不会共享
3. **扩展性**：不适合大量订阅者

### 7. 推荐的生产环境方案

对于生产环境，建议：

1. **使用 Vercel KV** 或外部数据库存储订阅者
2. **添加邮件验证**：订阅前发送确认邮件
3. **添加退订功能**：允许用户取消订阅
4. **添加管理界面**：查看和管理订阅者
5. **添加日志和监控**：跟踪订阅和邮件发送情况

### 8. 快速修复（使用 Vercel KV）

如果需要立即使用持久化存储，可以：

1. 在 Vercel 项目中启用 KV
2. 运行：`npm install @vercel/kv`
3. 更新 `api/subscribe.js` 使用 KV API

需要我帮你实现 Vercel KV 版本吗？

