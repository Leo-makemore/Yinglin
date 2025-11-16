# 数据库设置指南

## 选择数据库方案

我为你提供了两个数据库选项，你可以选择其中一个：

### 选项 1: Vercel KV (推荐 - 最简单)
- ✅ 与 Vercel 完美集成
- ✅ 设置简单，只需几步
- ✅ 基于 Redis，性能好
- ✅ 免费层：256MB 存储，每天 30,000 次读取

### 选项 2: Supabase (功能强大)
- ✅ 完全免费的 PostgreSQL 数据库
- ✅ 500MB 数据库存储
- ✅ 2GB 带宽
- ✅ 功能更丰富（可以扩展更多功能）

---

## 方案 1: Vercel KV 设置

### 步骤 1: 在 Vercel 中启用 KV

1. 进入你的 Vercel 项目
2. 点击 **Storage** 标签
3. 点击 **Create Database**
4. 选择 **KV** (Redis)
5. 创建数据库（会生成连接信息）

### 步骤 2: 安装依赖

```bash
npm install @vercel/kv
```

### 步骤 3: 更新代码

将 `api/subscribe.js` 替换为 `api/subscribe-kv.js` 的内容，或者重命名文件。

### 步骤 4: 环境变量

Vercel 会自动设置以下环境变量（无需手动配置）：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 步骤 5: 更新 vercel.json

```json
{
  "rewrites": [
    {
      "source": "/api/subscribe",
      "destination": "/api/subscribe-kv.js"
    }
  ]
}
```

或者直接重命名文件：`api/subscribe-kv.js` → `api/subscribe.js`

---

## 方案 2: Supabase 设置

### 步骤 1: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 **New Project**
4. 填写项目信息（名称、数据库密码等）
5. 等待项目创建完成（约 2 分钟）

### 步骤 2: 创建数据表

在 Supabase Dashboard 中，进入 **SQL Editor**，运行以下 SQL：

```sql
-- 创建订阅者表
CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- 启用 Row Level Security (可选，用于安全)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人插入（订阅）
CREATE POLICY "Allow public insert" ON subscribers
  FOR INSERT
  WITH CHECK (true);

-- 创建策略：允许所有人读取（用于导出）
CREATE POLICY "Allow public select" ON subscribers
  FOR SELECT
  USING (true);
```

### 步骤 3: 获取 API 密钥

1. 在 Supabase Dashboard 中，进入 **Settings** → **API**
2. 复制以下信息：
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)

### 步骤 4: 安装依赖

```bash
npm install @supabase/supabase-js
```

### 步骤 5: 设置环境变量

在 Vercel Dashboard 中，添加环境变量：
- `SUPABASE_URL` = 你的 Project URL
- `SUPABASE_ANON_KEY` = 你的 anon public key

### 步骤 6: 更新代码

将 `api/subscribe.js` 替换为 `api/subscribe-supabase.js` 的内容。

### 步骤 7: 更新 vercel.json

```json
{
  "rewrites": [
    {
      "source": "/api/subscribe",
      "destination": "/api/subscribe-supabase.js"
    }
  ]
}
```

---

## 更新导出和通知脚本

使用数据库后，你需要更新以下脚本：

### 更新 export-subscribers.js

使用 KV 版本：
```javascript
const { kv } = require('@vercel/kv');
const subscribers = await kv.get('subscribers:list');
```

使用 Supabase 版本：
```javascript
const { createClient } = require('@supabase/supabase-js');
const { data } = await supabase.from('subscribers').select('email');
```

### 更新 send-notification.js

同样需要从数据库读取订阅者，而不是从文件。

---

## 推荐选择

**如果你想要最简单的方案**：选择 **Vercel KV**
- 设置最快
- 与 Vercel 集成最好
- 适合中小型项目

**如果你想要更多功能**：选择 **Supabase**
- 免费额度更大
- 可以扩展更多功能（用户管理、实时数据等）
- 适合未来可能扩展的项目

---

## 需要帮助？

告诉我你选择哪个方案，我可以帮你：
1. ✅ 更新所有相关文件
2. ✅ 创建数据库迁移脚本
3. ✅ 更新导出和通知脚本
4. ✅ 测试整个流程

