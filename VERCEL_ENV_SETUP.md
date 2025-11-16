# Vercel 环境变量设置指南

## 🔧 问题诊断

你的 Redis 数据库中有数据（已确认有 1 个订阅者），但 API 返回空数组，说明 Vercel 上的环境变量可能没有正确设置。

## ✅ 解决方案：在 Vercel 中设置环境变量

### 步骤 1: 进入 Vercel Dashboard

1. 访问 [vercel.com](https://vercel.com)
2. 选择你的项目 `yinglin`
3. 进入 **Settings** → **Environment Variables**

### 步骤 2: 添加环境变量

添加以下两个环境变量：

**变量 1:**
- **Name**: `UPSTASH_REDIS_REST_URL`
- **Value**: `https://powerful-treefrog-38127.upstash.io`
- **Environments**: ✅ Production ✅ Preview ✅ Development

**变量 2:**
- **Name**: `UPSTASH_REDIS_REST_TOKEN`
- **Value**: `AZTvAAIncDI3NTIxZGRlM2IzNTk0ZjdmOTg0ZTA0NzdhNWY2YTI2YnAyMzgxMjc`
- **Environments**: ✅ Production ✅ Preview ✅ Development

### 步骤 3: 保存并重新部署

1. 点击 **Save** 保存环境变量
2. 进入 **Deployments** 标签
3. 找到最新的部署，点击 **...** → **Redeploy**
4. 或者推送新的代码触发自动部署

## 🔍 验证设置

### 方法 1: 检查 Vercel 日志

1. 进入 **Functions** → **Logs**
2. 调用 API：`https://yinglin.vercel.app/api/export-subscribers`
3. 查看日志，应该能看到：
   - 如果环境变量正确：会成功读取数据
   - 如果环境变量错误：会看到 "No Redis-related env vars found" 或 "Upstash Redis not configured"

### 方法 2: 测试 API

```bash
curl https://yinglin.vercel.app/api/export-subscribers
```

应该返回：
```json
{
  "subscribers": ["wangyl2002410@163.com"],
  "count": 1,
  "exported_at": "..."
}
```

### 方法 3: 使用 fetch-subscribers 脚本

```bash
npm run fetch-subscribers https://yinglin.vercel.app
```

应该显示：
```
✓ Successfully fetched 1 subscribers
✓ Saved to subscribers.json

Subscribers:
  1. wangyl2002410@163.com
```

## 📝 环境变量说明

### Vercel 自动创建的环境变量

当你通过 Vercel Marketplace 添加 Upstash Redis 时，Vercel 可能会自动创建：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

### 手动设置的环境变量

如果你手动添加，使用：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**代码已经支持两种命名方式，所以都可以工作！**

## ⚠️ 重要提示

1. **环境变量名称必须完全匹配**（区分大小写）
2. **确保所有环境都设置了**（Production、Preview、Development）
3. **重新部署后才能生效**
4. **Token 是敏感信息，不要提交到代码仓库**

## 🐛 如果还是不行

### 检查 1: 查看 Vercel 函数日志

在 Vercel Dashboard → Functions → Logs 中查看错误信息。

### 检查 2: 验证环境变量

在 Vercel Dashboard → Settings → Environment Variables 中确认：
- 变量名称正确
- 变量值正确
- 所有环境都已设置

### 检查 3: 测试 Redis 连接

使用我创建的测试脚本：
```bash
node test-redis.js
```

如果本地测试成功但 Vercel 不行，说明是环境变量问题。

---

**设置完成后，重新部署，然后测试 API 应该就能正常工作了！** 🎉

