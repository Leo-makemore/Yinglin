# Vercel 数据库配置指南

## 📋 配置步骤

### 1. 在 Vercel Marketplace 中配置

当你看到配置页面时：

**Environments（环境）**：
- ✅ **全选**：Development、Preview、Production
- 这样所有环境都可以使用数据库

**Custom Prefix（自定义前缀）**：
- **推荐：留空**（使用默认）
- 或者使用：`UPSTASH_` 或 `SUBSCRIBERS_`
- 如果设置了前缀，环境变量会是：`{PREFIX}_REDIS_REST_URL`

### 2. 配置完成后

Vercel 会自动创建环境变量。根据你的配置：

**如果使用默认（无前缀）**：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**如果设置了自定义前缀（例如 `SUBSCRIBERS_`）**：
- `SUBSCRIBERS_REDIS_REST_URL`
- `SUBSCRIBERS_REDIS_REST_TOKEN`

## 🔧 更新代码

### 选项 A: 使用默认配置（推荐）

如果你**没有设置自定义前缀**，直接使用：

```bash
cp api/subscribe-upstash.js api/subscribe.js
```

### 选项 B: 使用自定义前缀

如果你**设置了自定义前缀**，使用灵活版本：

```bash
cp api/subscribe-upstash-flexible.js api/subscribe.js
```

这个版本会自动检测环境变量，无论是否有前缀都能工作。

## ✅ 验证配置

### 方法 1: 检查环境变量

部署后，在 Vercel Dashboard → Settings → Environment Variables 中查看：
- 应该能看到 Redis 相关的环境变量

### 方法 2: 测试订阅

1. 访问你的网站
2. 尝试订阅
3. 检查 Vercel 函数日志（Functions → Logs）
4. 应该看到成功消息，而不是 "Database not configured"

### 方法 3: 查看日志

如果遇到问题，检查 Vercel 函数日志：
- 会显示可用的环境变量
- 会显示 Redis 连接状态

## 🐛 常见问题

### 问题 1: "Database not configured"

**原因**：环境变量名称不匹配

**解决**：
1. 检查 Vercel Dashboard 中的环境变量名称
2. 如果使用了自定义前缀，使用 `subscribe-upstash-flexible.js`
3. 或者手动设置环境变量名称

### 问题 2: 环境变量找不到

**解决**：
1. 确保在正确的环境中（Development/Preview/Production）
2. 重新部署项目
3. 检查 Vercel Integration 是否正确连接

### 问题 3: 连接失败

**解决**：
1. 检查 Upstash Dashboard 中的数据库状态
2. 确认环境变量值正确
3. 检查网络连接

## 📝 推荐配置

**最佳实践**：

```
Environments: ✅ Development ✅ Preview ✅ Production
Custom Prefix: (留空，使用默认)
```

这样：
- 所有环境都可以使用
- 环境变量名称标准
- 代码更简单

## 🚀 下一步

配置完成后：

1. **更新代码**：
   ```bash
   # 如果使用默认配置
   cp api/subscribe-upstash.js api/subscribe.js
   
   # 如果使用自定义前缀
   cp api/subscribe-upstash-flexible.js api/subscribe.js
   ```

2. **安装依赖**：
   ```bash
   npm install @upstash/redis
   ```

3. **部署**：
   ```bash
   git add .
   git commit -m "Configure Upstash Redis for subscriptions"
   git push
   ```

4. **测试**：
   - 访问网站
   - 尝试订阅
   - 检查是否成功

---

**配置完成后告诉我，我可以帮你验证和测试！**

