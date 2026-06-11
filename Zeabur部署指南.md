# 🚀 Zeabur 部署指南

## 📋 Zeabur 简介

Zeabur 是一个现代化的应用部署平台，支持：
- ✅ 全栈应用（前端 + 后端一起部署）
- ✅ 自动检测项目类型
- ✅ 支持 SQLite（持久化存储）
- ✅ 免费额度（每月 $5 免费额度）
- ✅ 自动 HTTPS
- ✅ GitHub 自动部署

---

## 🎯 部署方案

### 方案：前后端一起部署到 Zeabur

- **前端（React）** → Zeabur 静态网站服务
- **后端（Node.js + SQLite）** → Zeabur Node.js 服务
- **数据库（SQLite）** → Zeabur 持久化卷（Volume）

---

## 📦 准备工作

### 1. 创建 Zeabur 账号

访问：https://zeabur.com
- 使用 GitHub 账号登录
- 免费账号有 $5/月 额度

### 2. 准备 Git 仓库

```bash
cd d:\2026_backend_yjl\coffee-shop-scheduling

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "准备部署到 Zeabur"

# 推送到 GitHub
git remote add origin https://github.com/yourusername/coffee-shop-scheduling.git
git push -u origin main
```

---

## 🚀 部署步骤

### 步骤 1：创建项目

1. **登录 Zeabur**
   - https://dash.zeabur.com

2. **创建新项目**
   - 点击「Create Project」
   - 选择区域：Hong Kong（香港）或 Tokyo（东京）- 访问速度快
   - 项目名称：`coffee-shop-scheduling`

### 步骤 2：部署后端

1. **添加服务**
   - 在项目中点击「Add Service」
   - 选择「Git」
   - 选择你的 GitHub 仓库：`coffee-shop-scheduling`
   - Zeabur 会自动检测到 Node.js 项目

2. **配置后端服务**
   - 服务名称：`backend`
   - Root Directory：`backend`（后端代码目录）
   - Build Command：自动检测（npm install && npm run build）
   - Start Command：自动检测（npm start）
   - Port：3000

3. **环境变量**
   点击后端服务 → Settings → Environment Variables
   
   添加以下变量：
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
   PORT=3000
   ```

4. **添加持久化存储（重要！）**
   - 点击后端服务 → Settings → Volumes
   - 点击「Add Volume」
   - Mount Path：`/app/database`
   - 这样 SQLite 数据库文件就会持久化保存

5. **获取后端域名**
   - 点击后端服务 → Domain
   - 点击「Generate Domain」
   - 获得域名：`backend-xxx.zeabur.app`
   - 记下这个域名，前端需要用到

### 步骤 3：部署前端

1. **修改前端 API 地址**
   
   在本地修改 `frontend/.env.production`：
   ```env
   VITE_API_URL=https://backend-xxx.zeabur.app/api
   ```
   替换为你的实际后端域名！

2. **提交修改**
   ```bash
   git add frontend/.env.production
   git commit -m "更新后端 API 地址"
   git push
   ```

3. **添加前端服务**
   - 在 Zeabur 项目中点击「Add Service」
   - 选择「Git」
   - 选择同一个仓库：`coffee-shop-scheduling`
   - Zeabur 会检测到有多个可部署的项目

4. **配置前端服务**
   - 服务名称：`frontend`
   - Root Directory：`frontend`
   - Build Command：`npm install && npm run build`
   - Output Directory：`dist`
   - Install Command：`npm install`

5. **环境变量**
   点击前端服务 → Settings → Environment Variables
   
   添加：
   ```
   VITE_API_URL=https://backend-xxx.zeabur.app/api
   ```
   替换为你的后端域名！

6. **生成前端域名**
   - 点击前端服务 → Domain
   - 点击「Generate Domain」
   - 获得域名：`frontend-xxx.zeabur.app`

### 步骤 4：配置后端 CORS

1. **修改后端 CORS 配置**
   
   修改 `backend/src/server.ts`：
   ```typescript
   app.use(cors({
     origin: [
       'http://localhost:5173',
       'https://frontend-xxx.zeabur.app',  // 你的前端域名
       'https://your-custom-domain.com'    // 自定义域名（如有）
     ],
     credentials: true
   }));
   ```

2. **提交并推送**
   ```bash
   git add backend/src/server.ts
   git commit -m "更新 CORS 配置"
   git push
   ```

3. **Zeabur 会自动重新部署后端**

---

## 🎯 快速部署（完整流程）

```bash
# 1. 初始化 Git
cd d:\2026_backend_yjl\coffee-shop-scheduling
git init
git add .
git commit -m "Initial commit"

# 2. 推送到 GitHub
git remote add origin https://github.com/yourusername/coffee-shop-scheduling.git
git push -u origin main

# 3. 在 Zeabur 控制台操作
# - 创建项目
# - 添加后端服务（选择 backend 目录）
# - 添加持久化存储（/app/database）
# - 获取后端域名

# 4. 更新前端配置
# 修改 frontend/.env.production
# VITE_API_URL=https://backend-xxx.zeabur.app/api

# 5. 提交并推送
git add frontend/.env.production
git commit -m "更新 API 地址"
git push

# 6. 在 Zeabur 添加前端服务
# - 添加前端服务（选择 frontend 目录）
# - 配置环境变量
# - 生成域名

# 7. 更新后端 CORS
# 修改 backend/src/server.ts
# 添加前端域名到 CORS origin

# 8. 提交并推送
git add backend/src/server.ts
git commit -m "更新 CORS"
git push

# 9. 完成！
```

---

## 📝 Zeabur 配置文件（可选）

### 后端 zbpack.json

创建 `backend/zbpack.json`：

```json
{
  "build_command": "npm install && npm run build",
  "start_command": "npm start",
  "install_command": "npm install",
  "port": 3000
}
```

### 前端 zbpack.json

创建 `frontend/zbpack.json`：

```json
{
  "build_command": "npm install && npm run build",
  "output_dir": "dist",
  "install_command": "npm install"
}
```

---

## 💰 Zeabur 定价

### 免费额度
- **$5/月** 免费额度
- 适合小型项目和测试

### Developer Plan（开发者套餐）
- **$5/月**
- $10 额度（包含免费 $5）
- 适合个人项目

### Team Plan（团队套餐）
- **$10/月**
- $20 额度
- 适合小团队

### 资源消耗估算
- **前端（静态网站）**：约 $0.5-1/月
- **后端（Node.js）**：约 $2-4/月
- **总计**：约 $2.5-5/月（免费额度内）

---

## 🔧 环境变量清单

### 后端环境变量
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
DATABASE_PATH=/app/database/scheduling.db
```

### 前端环境变量
```env
VITE_API_URL=https://backend-xxx.zeabur.app/api
```

---

## 📊 部署后检查清单

### 后端检查
- [ ] 后端服务运行正常（绿色状态）
- [ ] 访问 `https://backend-xxx.zeabur.app/api/health` 返回 200
- [ ] 持久化存储已配置（/app/database）
- [ ] 环境变量已设置
- [ ] CORS 配置正确

### 前端检查
- [ ] 前端服务运行正常（绿色状态）
- [ ] 访问前端域名可以打开页面
- [ ] 静态资源加载正常
- [ ] 浏览器控制台无错误

### 功能测试
- [ ] 管理员登录：admin / admin123
- [ ] 员工登录：emp001 / password123
- [ ] 查看排班功能
- [ ] 提交请假功能
- [ ] 打卡功能
- [ ] 通知功能

---

## 🎯 常见问题

### Q1: 部署后 API 请求 404
**原因**：前端 API 地址配置错误

**解决**：
1. 检查 `frontend/.env.production` 中的 API 地址
2. 确保是后端的完整域名 + `/api`
3. 重新构建前端

### Q2: CORS 错误
**原因**：后端 CORS 未配置前端域名

**解决**：
1. 在 `backend/src/server.ts` 添加前端域名
2. 推送代码，Zeabur 会自动重新部署

### Q3: SQLite 数据库数据丢失
**原因**：未配置持久化存储

**解决**：
1. 后端服务 → Settings → Volumes
2. 添加 Volume，Mount Path：`/app/database`
3. 确保 `DATABASE_PATH` 环境变量指向 `/app/database/scheduling.db`

### Q4: 构建失败
**原因**：依赖安装或构建命令错误

**解决**：
1. 查看 Zeabur 构建日志
2. 确保 `package.json` 中的 scripts 正确
3. 检查 Node.js 版本兼容性

---

## 🔗 相关链接

- **Zeabur 控制台**：https://dash.zeabur.com
- **Zeabur 文档**：https://zeabur.com/docs
- **定价**：https://zeabur.com/pricing
- **GitHub**：https://github.com

---

## 🎉 优势总结

### Zeabur vs 其他平台

| 特性 | Zeabur | Vercel | Railway |
|------|--------|--------|---------|
| 全栈支持 | ✅ | ❌（仅前端） | ✅ |
| SQLite 支持 | ✅ | ❌ | ✅ |
| 免费额度 | $5/月 | 100GB流量 | $5/月 |
| 自动部署 | ✅ | ✅ | ✅ |
| 中国访问 | 🚀快 | ⚠️慢 | ⚠️慢 |
| 配置简单 | ✅ | ✅ | ✅ |

**推荐理由：**
- ✅ 支持全栈（前后端一起）
- ✅ 支持 SQLite（无需改数据库）
- ✅ 中国访问速度快
- ✅ 配置简单
- ✅ 有免费额度

---

## 📱 自定义域名（可选）

### 1. 准备域名
- 购买域名（阿里云、腾讯云等）

### 2. 在 Zeabur 配置
- 前端服务 → Domain → Custom Domain
- 输入你的域名：`www.your-domain.com`

### 3. 配置 DNS
- 在域名服务商添加 CNAME 记录
- 指向 Zeabur 提供的地址

### 4. 等待生效
- DNS 生效需要 10 分钟 - 24 小时
- Zeabur 会自动配置 HTTPS

---

准备好开始部署了吗？让我知道你需要帮助的步骤！🚀
