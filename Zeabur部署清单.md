# 📋 Zeabur 部署快速清单

## ✅ 已完成的准备工作

### 1. 配置文件
- ✅ `backend/zbpack.json` - 后端 Zeabur 配置
- ✅ `frontend/zbpack.json` - 前端 Zeabur 配置
- ✅ `frontend/.env.production` - 生产环境变量
- ✅ `frontend/public/_redirects` - SPA 路由配置
- ✅ `Zeabur部署指南.md` - 完整部署文档

### 2. 前端构建
- ✅ 构建产物：`frontend/dist/`
- ✅ 文件大小：
  - HTML: 0.45 kB
  - CSS: 27.04 kB (gzip: 5.52 kB)
  - JS: 444.00 kB (gzip: 119.73 kB)

---

## 🚀 部署步骤（按顺序执行）

### 第 1 步：初始化 Git 仓库

```bash
cd d:\2026_backend_yjl\coffee-shop-scheduling

# 初始化 Git
git init

# 添加所有文件
git add .

# 查看状态
git status

# 提交
git commit -m "准备部署到 Zeabur"
```

### 第 2 步：推送到 GitHub

```bash
# 在 GitHub 创建新仓库（不要初始化 README）
# 然后执行：

git remote add origin https://github.com/你的用户名/coffee-shop-scheduling.git
git branch -M main
git push -u origin main
```

### 第 3 步：登录 Zeabur

1. **访问**：https://zeabur.com
2. **使用 GitHub 登录**
3. **授权 Zeabur 访问你的仓库**

### 第 4 步：创建项目

1. 进入 Zeabur Dashboard：https://dash.zeabur.com
2. 点击「Create Project」
3. 选择区域：
   - 推荐：**Hong Kong**（香港）- 中国访问快
   - 或：**Tokyo**（东京）
4. 项目名称：`coffee-shop-scheduling`

### 第 5 步：部署后端

#### 5.1 添加后端服务

1. 在项目中点击「Add Service」
2. 选择「Git」
3. 选择仓库：`coffee-shop-scheduling`
4. Zeabur 会自动检测项目

#### 5.2 配置后端

1. **Root Directory**：`backend`
2. **环境变量**（点击 Settings → Environment Variables）：
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-请改成随机字符串
   PORT=3000
   DATABASE_PATH=/app/database/scheduling.db
   ```

#### 5.3 添加持久化存储（重要！）

1. 点击后端服务 → Settings → **Volumes**
2. 点击「Add Volume」
3. **Mount Path**：`/app/database`
4. 点击「Create」

#### 5.4 生成后端域名

1. 点击后端服务 → **Domain**
2. 点击「Generate Domain」
3. 获得域名：`backend-xxx.zeabur.app`
4. **记下这个域名**（下一步需要用）

### 第 6 步：更新前端配置

#### 6.1 修改 API 地址

在本地修改文件 `frontend/.env.production`：

```env
VITE_API_URL=https://backend-xxx.zeabur.app/api
```

⚠️ **替换为你在第 5.4 步获得的实际后端域名！**

#### 6.2 提交并推送

```bash
git add frontend/.env.production
git commit -m "更新后端 API 地址"
git push
```

### 第 7 步：部署前端

#### 7.1 添加前端服务

1. 在 Zeabur 项目中点击「Add Service」
2. 选择「Git」
3. 选择同一个仓库：`coffee-shop-scheduling`
4. Zeabur 会自动检测

#### 7.2 配置前端

1. **Root Directory**：`frontend`
2. **环境变量**（点击 Settings → Environment Variables）：
   ```
   VITE_API_URL=https://backend-xxx.zeabur.app/api
   ```
   ⚠️ 替换为你的后端域名！

#### 7.3 生成前端域名

1. 点击前端服务 → **Domain**
2. 点击「Generate Domain」
3. 获得域名：`frontend-xxx.zeabur.app`
4. **记下这个域名**

### 第 8 步：更新后端 CORS

#### 8.1 修改 CORS 配置

编辑文件 `backend/src/server.ts`，找到 CORS 配置部分：

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://frontend-xxx.zeabur.app',  // 替换为你的前端域名
  ],
  credentials: true
}));
```

#### 8.2 提交并推送

```bash
git add backend/src/server.ts
git commit -m "更新 CORS 配置"
git push
```

Zeabur 会自动重新部署后端！

### 第 9 步：测试系统

1. **访问前端**：`https://frontend-xxx.zeabur.app`
2. **测试登录**：
   - 管理员：`admin` / `admin123`
   - 员工：`emp001` / `password123`
3. **测试功能**：
   - 查看排班
   - 提交请假
   - 打卡功能
   - 通知功能

---

## 🔍 检查清单

### 后端检查
- [ ] 后端服务状态为绿色（Running）
- [ ] 访问 `https://backend-xxx.zeabur.app/api/health` 返回 OK
- [ ] 持久化存储已添加（Mount Path: /app/database）
- [ ] 环境变量已设置（4 个变量）
- [ ] 后端域名已生成

### 前端检查
- [ ] 前端服务状态为绿色（Running）
- [ ] 访问前端域名可以打开页面
- [ ] 登录页面显示正常
- [ ] 浏览器控制台无 CORS 错误
- [ ] API 请求成功（状态码 200）

### 功能测试
- [ ] 管理员可以登录
- [ ] 员工可以登录
- [ ] 查看排班功能正常
- [ ] 提交请假功能正常
- [ ] 打卡功能正常
- [ ] 通知功能正常

---

## ⚠️ 重要提醒

### 1. JWT_SECRET 必须修改
```env
JWT_SECRET=your-super-secret-jwt-key-请改成随机字符串
```
改为一个随机的、至少 32 位的字符串！

### 2. 持久化存储必须配置
否则每次重启后端，数据库数据会丢失！

### 3. CORS 必须配置
否则前端无法调用后端 API！

### 4. 域名需要正确配置
- 前端 `.env.production` 中的 API 地址
- 后端 CORS 中的前端域名

---

## 💰 费用预估

### Zeabur 免费额度
- **$5/月**：免费额度
- **前端**：约 $0.5-1/月
- **后端**：约 $2-4/月
- **总计**：约 $2.5-5/月（在免费额度内）

### 如果超出免费额度
- Developer Plan：$5/月（$10 额度）
- Team Plan：$10/月（$20 额度）

---

## 🆘 遇到问题？

### API 请求失败
1. 检查前端 `.env.production` 中的 API 地址
2. 检查后端 CORS 配置
3. 查看 Zeabur 后端服务日志

### 数据库数据丢失
1. 检查持久化存储是否配置
2. Mount Path 必须是 `/app/database`
3. DATABASE_PATH 必须指向 `/app/database/scheduling.db`

### 页面刷新 404
1. 确保 `frontend/public/_redirects` 文件存在
2. 内容为：`/*  /index.html  200`

### 构建失败
1. 查看 Zeabur 构建日志
2. 检查 `zbpack.json` 配置
3. 确保本地 `npm run build` 可以成功

---

## 🔗 相关链接

- **Zeabur Dashboard**：https://dash.zeabur.com
- **Zeabur 文档**：https://zeabur.com/docs
- **完整部署指南**：[Zeabur部署指南.md](Zeabur部署指南.md)

---

## 🎉 开始部署！

按照上面的 9 个步骤执行即可！

如果遇到任何问题，随时告诉我！🚀
