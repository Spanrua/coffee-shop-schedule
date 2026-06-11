# 🚀 EdgeOne Pages 部署指南

## 📋 部署方案

EdgeOne Pages 适合部署**前端静态网站**，后端需要单独部署。

### 方案：前后端分离部署

- **前端** → EdgeOne Pages
- **后端** → 腾讯云函数（Serverless Cloud Function）或云服务器

---

## 🎯 步骤 1：准备前端部署

### 1.1 修改前端 API 地址

需要将前端的 API 请求地址改为后端的实际地址。

修改文件：`frontend/src/services/api.ts`

```typescript
// 当前配置
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 改为
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-domain.com/api';
```

### 1.2 创建环境变量文件

创建 `frontend/.env.production`：

```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 1.3 构建前端

```bash
cd frontend
npm install
npm run build
```

构建产物在 `frontend/dist` 目录。

---

## 🎯 步骤 2：部署前端到 EdgeOne Pages

### 2.1 通过 Git 部署（推荐）

1. **创建 Git 仓库**
   ```bash
   cd d:\2026_backend_yjl\coffee-shop-scheduling
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub/Gitee**
   ```bash
   git remote add origin https://github.com/yourusername/coffee-shop-scheduling.git
   git push -u origin main
   ```

3. **在 EdgeOne Pages 控制台**
   - 访问：https://console.cloud.tencent.com/edgeone/pages
   - 点击「创建项目」
   - 选择「从 Git 导入」
   - 连接你的 GitHub/Gitee 仓库
   - 配置构建设置：

   **构建配置：**
   ```
   构建命令：cd frontend && npm install && npm run build
   输出目录：frontend/dist
   安装命令：cd frontend && npm install
   ```

   **环境变量：**
   ```
   VITE_API_URL = https://your-backend-domain.com/api
   ```

4. **部署**
   - 点击「部署」
   - 等待构建完成
   - 获得域名：`your-project.edgeone.app`

### 2.2 通过命令行部署

1. **安装 EdgeOne CLI**
   ```bash
   npm install -g @tencent/edgeone-pages-cli
   ```

2. **登录**
   ```bash
   edgeone login
   ```

3. **初始化项目**
   ```bash
   cd d:\2026_backend_yjl\coffee-shop-scheduling\frontend
   edgeone init
   ```

4. **部署**
   ```bash
   npm run build
   edgeone deploy
   ```

### 2.3 手动上传部署

1. **构建前端**
   ```bash
   cd frontend
   npm run build
   ```

2. **在 EdgeOne Pages 控制台**
   - 创建新项目
   - 选择「手动上传」
   - 将 `frontend/dist` 目录打包为 zip
   - 上传 zip 文件
   - 完成部署

---

## 🎯 步骤 3：部署后端

### 选项 A：腾讯云函数（Serverless）

后端需要改造为 Serverless 架构，SQLite 需要改为云数据库。

**不推荐**：改动较大，需要重构代码。

### 选项 B：腾讯云轻量应用服务器（推荐）

1. **购买轻量服务器**
   - 访问：https://console.cloud.tencent.com/lighthouse
   - 选择配置：2核2G，5Mbps
   - 系统：Ubuntu 22.04

2. **连接服务器**
   ```bash
   ssh ubuntu@your-server-ip
   ```

3. **安装环境**
   ```bash
   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # 安装 Git
   sudo apt-get install git -y

   # 安装 PM2
   sudo npm install -g pm2
   ```

4. **部署代码**
   ```bash
   # 克隆代码
   git clone https://github.com/yourusername/coffee-shop-scheduling.git
   cd coffee-shop-scheduling/backend

   # 安装依赖
   npm install

   # 构建
   npm run build

   # 启动
   pm2 start dist/server.js --name coffee-shop-backend

   # 开机自启
   pm2 startup
   pm2 save
   ```

5. **配置 Nginx 反向代理**
   ```bash
   sudo apt-get install nginx -y
   sudo nano /etc/nginx/sites-available/coffee-shop
   ```

   配置内容：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/coffee-shop /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **配置 HTTPS（可选）**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

### 选项 C：Docker 部署到云服务器

1. **在服务器上安装 Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **传输代码**
   ```bash
   # 本地打包
   cd d:\2026_backend_yjl\coffee-shop-scheduling
   tar -czf coffee-shop.tar.gz backend/ docker-compose.yml

   # 上传到服务器
   scp coffee-shop.tar.gz ubuntu@your-server-ip:~/
   ```

3. **在服务器上解压并启动**
   ```bash
   ssh ubuntu@your-server-ip
   tar -xzf coffee-shop.tar.gz
   cd coffee-shop-scheduling
   docker compose up -d backend
   ```

---

## 🎯 步骤 4：配置 CORS

后端需要允许前端域名跨域访问。

修改 `backend/src/server.ts`：

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-project.edgeone.app',  // EdgeOne Pages 域名
    'https://your-custom-domain.com'      // 自定义域名
  ],
  credentials: true
}));
```

---

## 🎯 步骤 5：更新前端配置

### 5.1 创建 EdgeOne Pages 配置文件

创建 `edgeone.config.json`：

```json
{
  "build": {
    "command": "cd frontend && npm install && npm run build",
    "output": "frontend/dist"
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-domain.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-domain.com/api"
  }
}
```

### 5.2 添加 _redirects 文件（用于 SPA 路由）

创建 `frontend/public/_redirects`：

```
/*  /index.html  200
```

---

## 📝 完整部署流程总结

### 1. 准备工作
```bash
# 1. 构建前端
cd frontend
npm run build

# 2. 测试构建产物
npx serve dist
```

### 2. 部署前端到 EdgeOne Pages
- 方式 1：通过 Git 仓库自动部署
- 方式 2：使用 EdgeOne CLI
- 方式 3：手动上传 zip

### 3. 部署后端到腾讯云服务器
```bash
# 服务器上执行
git clone your-repo
cd backend
npm install
npm run build
pm2 start dist/server.js
```

### 4. 配置环境变量
- 前端：`VITE_API_URL=https://api.your-domain.com/api`
- 后端：配置 CORS 允许前端域名

### 5. 测试
- 访问前端：`https://your-project.edgeone.app`
- 测试 API：`https://api.your-domain.com/api/health`

---

## 🔧 环境变量配置

### 前端环境变量
创建 `frontend/.env.production`：

```env
VITE_API_URL=https://api.your-domain.com/api
```

### 后端环境变量
在服务器上创建 `backend/.env`：

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_PATH=./database/scheduling.db
```

---

## 📊 部署成本估算（腾讯云）

### EdgeOne Pages（前端）
- **免费额度**：
  - 100GB 流量/月
  - 1000 次构建/月
  - 无限项目数
- **超出后**：流量 ¥0.20/GB

### 轻量应用服务器（后端）
- **2核2G，5Mbps**：¥112/年
- **4核8G，8Mbps**：¥288/年

### 域名（可选）
- **.com**：¥55/年
- **.cn**：¥29/年

**总计最低**：¥112/年（仅后端服务器）

---

## 🎯 快速部署命令

### 前端部署
```bash
cd d:\2026_backend_yjl\coffee-shop-scheduling\frontend
npm run build
# 手动上传 dist 文件夹到 EdgeOne Pages
```

### 后端部署
```bash
# 在服务器上
git clone https://github.com/yourusername/coffee-shop-scheduling.git
cd coffee-shop-scheduling/backend
npm install
npm run build
pm2 start dist/server.js --name coffee-shop
pm2 save
```

---

## ❓ 常见问题

### Q1: EdgeOne Pages 如何配置自定义域名？
A: 在 EdgeOne Pages 控制台 → 项目设置 → 自定义域名 → 添加域名并配置 CNAME。

### Q2: 后端 API 跨域问题？
A: 确保后端 CORS 配置包含前端域名。

### Q3: 前端路由 404 问题？
A: 添加 `_redirects` 文件重定向所有路由到 `index.html`。

### Q4: 数据库文件丢失？
A: 确保 SQLite 数据库文件路径在服务器上持久化（不在临时目录）。

---

## 🎉 部署完成检查清单

- [ ] 前端成功部署到 EdgeOne Pages
- [ ] 前端可以访问
- [ ] 后端成功部署到云服务器
- [ ] 后端 API 可以访问
- [ ] 前端可以调用后端 API
- [ ] 登录功能正常
- [ ] 数据库正常工作
- [ ] 配置了 HTTPS
- [ ] 配置了自定义域名（可选）

---

需要我帮你执行具体的哪一步吗？
