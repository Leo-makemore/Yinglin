# Token 认证使用指南

## 🔐 功能说明

已添加基于 token 的私有内容访问功能，可以保护特定页面或内容区域。

## 📝 设置 Token

### 方法 1: 使用环境变量（推荐）

在 Vercel Dashboard → Settings → Environment Variables 中添加：

- **Name**: `ACCESS_TOKEN`
- **Value**: 你的访问 token（例如：`my-secret-token-123`）
- **Environments**: ✅ Production ✅ Preview ✅ Development

### 方法 2: 使用 Redis 存储多个 Token

Token 会存储在 Redis 的 `valid_tokens:list` 键中。你可以：

1. 通过 API 管理 token（需要额外开发）
2. 直接在代码中设置默认 token

## 🎯 使用方式

### 方式 1: 保护整个页面

在需要保护的页面添加：

```html
<script src="auth.js"></script>
<script>
  // 页面加载时检查认证
  window.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
  });
</script>
```

### 方式 2: 保护部分内容（已在 reference.html 中实现）

```html
<!-- 登录表单（未认证时显示） -->
<div id="login-form-container">
  <form id="private-login-form">
    <input type="password" id="private-token-input" placeholder="Enter access token" />
    <button type="submit">Access</button>
  </form>
</div>

<!-- 私有内容（认证后显示） -->
<div id="private-content" style="display: none;">
  <h2>Private Content</h2>
  <p>这是私有内容...</p>
</div>

<script src="auth.js"></script>
<script>
  // 检查认证状态并显示/隐藏内容
  if (isAuthenticated()) {
    document.getElementById('private-content').style.display = 'block';
    document.getElementById('login-form-container').style.display = 'none';
  }
</script>
```

## 🔑 默认 Token

如果没有设置环境变量，默认 token 是：`default-token-change-me`

**重要**：请务必在 Vercel 中设置 `ACCESS_TOKEN` 环境变量！

## 📋 功能特点

- ✅ Token 验证通过 API 进行
- ✅ Token 存储在 localStorage（24小时有效）
- ✅ 支持多个有效 token（存储在 Redis）
- ✅ 自动过期机制
- ✅ 可以保护整个页面或部分内容
- ✅ 独立的登录页面

## 🚀 快速开始

1. **设置环境变量**：
   - 在 Vercel 中添加 `ACCESS_TOKEN`

2. **访问私有内容**：
   - 访问 `reference.html` 页面
   - 在页面底部会看到登录表单
   - 输入正确的 token
   - 私有内容会显示

3. **使用独立登录页面**：
   - 访问 `login.html`
   - 输入 token 登录
   - 会自动跳转到之前访问的页面

## 🔧 自定义

### 修改 Token 有效期

在 `auth.js` 中修改：
```javascript
const TOKEN_EXPIRY_HOURS = 24; // 改为你想要的小时数
```

### 添加更多有效 Token

可以通过 Redis 存储多个 token。在 `api/verify-token.js` 中，token 列表存储在 `valid_tokens:list`。

### 保护其他页面

在任何页面中添加：
```html
<script src="auth.js"></script>
<script>
  requireAuth(); // 未认证会跳转到 login.html
</script>
```

---

**现在你可以在任何页面使用 token 来保护私有内容了！** 🔒

