# Vercel Marketplace 数据库设置指南

## 🎯 推荐方案对比

### 方案 1: Upstash Redis ⭐ (推荐 - 最简单)
- ✅ **免费层**：10,000 次命令/天，256MB 存储
- ✅ **设置简单**：通过 Vercel Marketplace 一键集成
- ✅ **性能好**：Redis 速度快
- ✅ **适合**：中小型项目，订阅功能

### 方案 2: Supabase Postgres ⭐ (功能强大)
- ✅ **免费层**：500MB 数据库，2GB 带宽
- ✅ **功能丰富**：可以扩展更多功能
- ✅ **SQL 支持**：完整的 PostgreSQL
- ✅ **适合**：需要更多功能或未来扩展

### 方案 3: Neon Postgres (Serverless Postgres)
- ✅ **免费层**：0.5GB 存储
- ✅ **Serverless**：按需扩展
- ✅ **适合**：需要 PostgreSQL 但想要 serverless

---

## 🚀 方案 1: Upstash Redis 设置

### 步骤 1: 在 Vercel Marketplace 中添加 Upstash

1. 进入你的 Vercel 项目
2. 点击 **Settings** → **Integrations**
3. 搜索 **Upstash**
4. 点击 **Add Integration**
5. 选择 **Redis** 或 **Serverless DB**
6. 创建新的数据库（或连接现有数据库）
7. Vercel 会自动设置环境变量：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 步骤 2: 安装依赖

```bash
npm install @upstash/redis
```

### 步骤 3: 更新代码

将 `api/subscribe.js` 替换为 `api/subscribe-upstash.js` 的内容：

```bash
# 备份原文件
cp api/subscribe.js api/subscribe-backup.js

# 使用 Upstash 版本
cp api/subscribe-upstash.js api/subscribe.js
```

### 步骤 4: 更新 vercel.json

```json
{
  "rewrites": [
    {
      "source": "/api/subscribe",
      "destination": "/api/subscribe.js"
    }
  ]
}
```

### 步骤 5: 部署

```bash
git add .
git commit -m "Add Upstash Redis for subscriptions"
git push
```

---

## 🗄️ 方案 2: Supabase Postgres 设置

### 步骤 1: 在 Vercel Marketplace 中添加 Supabase

1. 进入你的 Vercel 项目
2. 点击 **Settings** → **Integrations**
3. 搜索 **Supabase**
4. 点击 **Add Integration**
5. 连接你的 Supabase 项目（或创建新项目）
6. Vercel 会自动设置环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 步骤 2: 创建数据表

在 Supabase Dashboard → SQL Editor，运行：

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- 启用 Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 允许公开插入（订阅）
CREATE POLICY "Allow public insert" ON subscribers
  FOR INSERT WITH CHECK (true);

-- 允许公开读取（导出）
CREATE POLICY "Allow public select" ON subscribers
  FOR SELECT USING (true);
```

### 步骤 3: 安装依赖

```bash
npm install @supabase/supabase-js
```

### 步骤 4: 更新代码

使用 `api/subscribe-supabase.js` 的内容替换 `api/subscribe.js`

---

## 🐘 方案 3: Neon Postgres 设置

### 步骤 1: 在 Vercel Marketplace 中添加 Neon

1. 进入你的 Vercel 项目
2. 点击 **Settings** → **Integrations**
3. 搜索 **Neon**
4. 点击 **Add Integration**
5. 创建新的数据库（或连接现有数据库）
6. Vercel 会自动设置环境变量：
   - `DATABASE_URL`

### 步骤 2: 安装依赖

```bash
npm install @neondatabase/serverless
```

### 步骤 3: 更新代码

使用 `api/subscribe-neon.js` 的内容替换 `api/subscribe.js`

**注意**：Neon 版本会自动创建表，无需手动运行 SQL。

---

## 📊 方案对比表

| 特性 | Upstash Redis | Supabase | Neon |
|------|---------------|----------|------|
| **免费额度** | 10K 命令/天 | 500MB 存储 | 0.5GB 存储 |
| **设置难度** | ⭐ 最简单 | ⭐⭐ 中等 | ⭐⭐ 中等 |
| **性能** | ⭐⭐⭐ 最快 | ⭐⭐ 快 | ⭐⭐ 快 |
| **功能** | 键值存储 | 完整 SQL | 完整 SQL |
| **扩展性** | ⭐⭐ 中等 | ⭐⭐⭐ 最好 | ⭐⭐⭐ 最好 |

---

## 🎯 我的推荐

**对于订阅功能，我推荐：Upstash Redis**

原因：
1. ✅ 设置最简单（一键集成）
2. ✅ 免费额度足够（10,000 次/天）
3. ✅ 性能最好（Redis）
4. ✅ 自动配置环境变量
5. ✅ 完全够用（只是存储邮箱列表）

**如果你未来需要更多功能**：选择 Supabase 或 Neon

---

## 🔧 快速切换

如果你想切换数据库，只需：

1. 在 Vercel Marketplace 中添加新的数据库
2. 安装对应的 npm 包
3. 替换 `api/subscribe.js` 为对应的版本
4. 更新 `vercel.json`（如果需要）
5. 部署

---

## 📝 更新相关脚本

使用数据库后，记得更新：

1. **export-subscribers.js** - 使用对应的数据库客户端
2. **send-notification.js** - 从数据库读取订阅者

我可以帮你创建这些更新版本的脚本。

---

## ❓ 需要帮助？

告诉我你选择哪个方案，我可以：
1. ✅ 帮你完成所有配置
2. ✅ 更新所有相关文件
3. ✅ 测试整个流程
4. ✅ 创建迁移脚本

