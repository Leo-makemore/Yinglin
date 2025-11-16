# 订阅功能测试指南

## 🧪 上线后测试步骤

### 1. 测试订阅功能

#### 方法 A: 通过网站测试（推荐）

1. **访问你的网站**
   ```
   https://yinglin.vercel.app
   ```

2. **找到订阅表单**
   - 在首页的 "Subscribe" 部分
   - 输入一个测试邮箱（建议使用真实邮箱，方便后续测试邮件）

3. **提交订阅**
   - 点击 "Subscribe" 按钮
   - 应该看到成功消息："Thank you for your subscription!"

4. **验证订阅**
   - 检查是否显示订阅成功
   - 可以尝试用同一个邮箱再次订阅，应该显示 "You are already subscribed!"

#### 方法 B: 通过 API 直接测试

使用 curl 或 Postman：

```bash
curl -X POST https://yinglin.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期响应**：
```json
{
  "message": "Thank you for your subscription!",
  "total": 1
}
```

### 2. 测试取消订阅功能

#### 方法 A: 通过网站测试

1. **访问取消订阅页面**
   ```
   https://yinglin.vercel.app/unsubscribe.html
   ```

2. **输入已订阅的邮箱**
   - 使用刚才订阅的测试邮箱

3. **提交取消订阅**
   - 点击 "Unsubscribe" 按钮
   - 应该看到："You have been successfully unsubscribed. We're sorry to see you go!"

4. **验证取消**
   - 再次尝试订阅同一个邮箱
   - 应该可以重新订阅成功

#### 方法 B: 通过 API 直接测试

```bash
curl -X POST https://yinglin.vercel.app/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**预期响应**：
```json
{
  "message": "You have been successfully unsubscribed. We're sorry to see you go!",
  "total": 0
}
```

### 3. 检查数据库存储

#### 方法 A: 通过导出 API

```bash
curl https://yinglin.vercel.app/api/export-subscribers
```

**预期响应**：
```json
{
  "subscribers": ["test@example.com"],
  "count": 1,
  "exported_at": "2025-01-16T..."
}
```

#### 方法 B: 在 Vercel Dashboard 查看

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 进入 **Storage** → **KV** (或 Upstash)
4. 查看存储的数据

### 4. 测试邮件通知功能

#### 本地测试（推荐）

1. **从 Vercel 获取订阅者列表**
   ```bash
   npm run fetch-subscribers https://yinglin.vercel.app
   ```
   这会自动保存到本地 `subscribers.json`

2. **发送测试邮件**
   ```bash
   npm run notify "Test Update" "This is a test notification from my website!"
   ```

3. **检查邮箱**
   - 检查测试邮箱的收件箱
   - 检查垃圾邮件文件夹（如果没收到）

#### 验证邮件内容

邮件应该包含：
- ✅ 主题行：你设置的主题
- ✅ 消息内容：你设置的消息
- ✅ 网站链接按钮
- ✅ 取消订阅说明

### 5. 查看日志和调试

#### Vercel 函数日志

1. **进入 Vercel Dashboard**
   - 选择你的项目
   - 点击 **Functions** 标签
   - 查看函数执行日志

2. **检查错误**
   - 查看是否有错误信息
   - 检查 Redis 连接是否正常
   - 检查环境变量是否正确

#### 常见错误排查

**错误：Database not configured**
- 检查环境变量 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 是否设置
- 确认 Upstash Redis 集成已正确连接

**错误：Failed to save subscription**
- 检查 Redis 连接
- 查看 Upstash Dashboard 中的数据库状态
- 检查免费额度是否用完

**订阅成功但邮件没收到**
- 检查 `.env` 文件中的 SMTP 配置
- 验证 Gmail App Password 是否正确
- 检查垃圾邮件文件夹
- 查看 `send-notification.js` 的输出日志

### 6. 完整测试流程

#### 端到端测试

1. **订阅测试**
   ```bash
   # 1. 访问网站并订阅
   # 2. 验证订阅成功
   # 3. 检查数据库中有记录
   ```

2. **取消订阅测试**
   ```bash
   # 1. 访问取消订阅页面
   # 2. 输入邮箱并取消
   # 3. 验证数据库中已移除
   ```

3. **邮件通知测试**
   ```bash
   # 1. 获取订阅者列表
   npm run fetch-subscribers
   
   # 2. 发送测试邮件
   npm run notify "Test" "Testing email notification"
   
   # 3. 检查邮箱是否收到
   ```

4. **重复订阅测试**
   ```bash
   # 1. 尝试用已订阅的邮箱再次订阅
   # 2. 应该显示 "You are already subscribed!"
   ```

5. **取消后重新订阅测试**
   ```bash
   # 1. 取消订阅
   # 2. 再次订阅同一个邮箱
   # 3. 应该可以成功订阅
   ```

### 7. 测试检查清单

- [ ] 订阅功能正常工作
- [ ] 订阅成功消息显示正确
- [ ] 重复订阅被正确阻止
- [ ] 取消订阅功能正常工作
- [ ] 取消订阅后可以重新订阅
- [ ] 数据正确存储在 Redis 中
- [ ] 导出 API 可以获取订阅者列表
- [ ] 邮件通知可以正常发送
- [ ] 邮件内容格式正确
- [ ] 取消订阅链接在邮件中可用（如果添加了）

### 8. 性能测试

#### 测试多个订阅

```bash
# 测试多个邮箱订阅
for email in test1@example.com test2@example.com test3@example.com; do
  curl -X POST https://yinglin.vercel.app/api/subscribe \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\"}"
done
```

#### 检查响应时间

- 订阅 API 应该在 1-2 秒内响应
- 如果响应慢，检查 Redis 连接和网络

### 9. 安全测试

- [ ] 无效邮箱被拒绝（如 "invalid"）
- [ ] 空邮箱被拒绝
- [ ] SQL 注入尝试被阻止（虽然使用 Redis，但也要测试）
- [ ] XSS 攻击被阻止

### 10. 移动端测试

- [ ] 在手机上访问网站
- [ ] 订阅表单在移动端显示正常
- [ ] 可以正常提交订阅
- [ ] 取消订阅页面在移动端可用

---

## 🐛 遇到问题？

### 问题 1: 订阅失败

**检查**：
1. Vercel 函数日志
2. Redis 连接状态
3. 环境变量配置

**解决**：
```bash
# 查看 Vercel 日志
# Dashboard → Functions → Logs
```

### 问题 2: 邮件没收到

**检查**：
1. SMTP 配置是否正确
2. Gmail App Password 是否有效
3. 邮件是否在垃圾文件夹

**解决**：
```bash
# 测试 SMTP 连接
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('SMTP OK')).catch(console.error);
"
```

### 问题 3: 数据丢失

**检查**：
1. Redis 数据库状态
2. Upstash Dashboard
3. 免费额度是否用完

**解决**：
- 检查 Upstash Dashboard
- 查看数据库使用情况
- 考虑升级到付费计划（如果需要）

---

## 📝 测试记录模板

```
测试日期: ___________
测试人员: ___________

订阅测试:
- [ ] 成功
- [ ] 失败
- 备注: ___________

取消订阅测试:
- [ ] 成功
- [ ] 失败
- 备注: ___________

邮件通知测试:
- [ ] 成功
- [ ] 失败
- 备注: ___________

问题记录:
___________
___________
```

---

**测试完成后，你的订阅功能应该可以正常使用了！** 🎉

