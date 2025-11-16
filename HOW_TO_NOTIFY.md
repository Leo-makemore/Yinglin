# 如何发送邮件通知给订阅者

## 📍 订阅者邮箱存储位置

### 当前实现（本地开发）
- **文件位置**：`subscribers.json`（项目根目录）
- **格式**：JSON 数组，例如：`["user1@example.com", "user2@example.com"]`

### Vercel 部署后的情况
⚠️ **重要问题**：在 Vercel 上，订阅者数据存储在：
- `/tmp/subscribers.json`（临时存储）
- 内存中（in-memory storage）

**限制**：
- 数据在部署后会丢失
- 多个函数实例之间数据不共享
- 不适合生产环境使用

## 📧 如何发送邮件通知

### 方法 1：使用本地脚本（推荐用于测试）

1. **确保有订阅者**：
   ```bash
   cat subscribers.json
   ```

2. **发送通知**：
   ```bash
   npm run notify "更新主题" "更新内容"
   ```

   或者：
   ```bash
   node send-notification.js "Website Update" "I've added new projects to my website!"
   ```

3. **查看结果**：
   脚本会显示发送统计：
   ```
   Sending notifications to 5 subscribers...
   ✓ Sent to user1@example.com
   ✓ Sent to user2@example.com
   ...
   --- Summary ---
   Total subscribers: 5
   Successfully sent: 5
   Failed: 0
   ```

### 方法 2：从 Vercel 获取订阅者列表

由于 Vercel 上数据不持久化，你需要：

1. **通过 API 获取订阅者**（需要添加一个获取端点的 API）
2. **或者使用 Vercel KV/数据库**（推荐用于生产环境）

## 🔧 当前工作流程

### 本地开发环境：
```
用户订阅 → 保存到 subscribers.json → 使用 send-notification.js 发送邮件
```

### Vercel 生产环境：
```
用户订阅 → 保存到 /tmp 或内存 → ❌ 数据会丢失
```

## ⚠️ 问题与解决方案

### 问题 1：Vercel 上数据不持久化

**解决方案选项：**

#### 选项 A：使用 Vercel KV（推荐）
1. 在 Vercel 项目中启用 KV
2. 安装：`npm install @vercel/kv`
3. 更新 `api/subscribe.js` 使用 KV 存储

#### 选项 B：使用外部数据库
- MongoDB Atlas（免费层可用）
- Supabase（PostgreSQL）
- Firebase Realtime Database

#### 选项 C：定期导出订阅者
创建一个 API 端点来导出订阅者列表，定期下载保存。

### 问题 2：如何从 Vercel 获取订阅者列表

**临时方案**：创建一个导出 API 端点

我可以帮你创建一个 `api/export-subscribers.js` 端点，让你可以：
- 访问 `/api/export-subscribers` 获取所有订阅者
- 下载 JSON 文件
- 在本地使用 `send-notification.js` 发送邮件

## 📝 推荐的完整工作流程

### 方案 1：使用 Vercel KV（最佳）

1. **订阅时**：保存到 Vercel KV
2. **发送通知时**：
   - 创建一个 API 端点 `/api/send-notification`
   - 在 Vercel Dashboard 中手动触发
   - 或者使用 Vercel Cron Jobs 定时发送

### 方案 2：混合方案（当前可用）

1. **订阅时**：保存到 Vercel（临时）
2. **定期导出**：使用导出 API 下载订阅者列表
3. **本地发送**：使用 `send-notification.js` 发送邮件

### 方案 3：完全本地管理

1. **订阅时**：保存到本地 `subscribers.json`
2. **发送时**：直接使用 `send-notification.js`

## 🚀 快速开始

### 方法 1：从 Vercel 获取订阅者并发送通知（推荐）

```bash
# 1. 从 Vercel 获取订阅者列表（自动保存到本地）
npm run fetch-subscribers

# 或者指定网站 URL
npm run fetch-subscribers https://yinglin.vercel.app

# 2. 发送通知
npm run notify "网站更新" "我更新了网站内容，快来看看吧！"
```

### 方法 2：直接使用本地订阅者列表

```bash
# 1. 检查订阅者
cat subscribers.json

# 2. 发送通知
npm run notify "网站更新" "我更新了网站内容，快来看看吧！"
```

### 方法 3：手动从 API 获取

```bash
# 1. 访问 API 端点获取订阅者
curl https://yinglin.vercel.app/api/export-subscribers

# 2. 保存到 subscribers.json
# 3. 使用 send-notification.js 发送
```

---

**需要我帮你实现哪个方案？**
- ✅ 创建导出订阅者的 API 端点
- ✅ 实现 Vercel KV 版本（持久化存储）
- ✅ 创建发送通知的 API 端点（在 Vercel 上直接发送）

