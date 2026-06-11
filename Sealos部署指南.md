# 🚀 Sealos 部署指南

## 📋 Sealos 简介

Sealos 是一个基于 Kubernetes 的云操作系统，特点：
- ✅ 中国访问速度快
- ✅ 支持全栈应用
- ✅ 按需计费，价格便宜
- ✅ 自动扩容
- ✅ 支持数据库
- ✅ 图形化界面，操作简单

---

## 🎯 部署方案

### 方案：前后端分离 + 独立数据库

- **前端（React）** → Sealos 应用部署
- **后端（Node.js）** → Sealos 应用部署
- **数据库（PostgreSQL）** → Sealos 数据库服务

⚠️ **注意**：Sealos 容器重启后文件会丢失，所以需要将 SQLite 改为 PostgreSQL

---

## 📦 准备工作

### 1. 修改后端数据库为 PostgreSQL

由于 Sealos 容器文件系统不持久化，我们需要将 SQLite 改为 PostgreSQL。

#### 安装 PostgreSQL 依赖

```bash
cd backend
npm install pg
npm install --save-dev @types/pg
```

#### 创建 PostgreSQL 适配器

创建文件 `backend/src/db-postgres.ts`：

```typescript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = {
  prepare: (sql: string) => ({
    run: async (...params: any[]) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return { changes: result.rowCount };
      } finally {
        client.release();
      }
    },
    get: async (...params: any[]) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return result.rows[0];
      } finally {
        client.release();
      }
    },
    all: async (...params: any[]) => {
      const client = await pool.connect();
      try {
        const result = await client.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return result.rows;
      } finally {
        client.release();
      }
    },
  }),
  exec: async (sql: string) => {
    const client = await pool.connect();
    try {
      await client.query(sql);
    } finally {
      client.release();
    }
  },
};

export default db;
```

---

## 🚀 Sealos 部署步骤

### 步骤 1：注册并登录 Sealos

1. **访问 Sealos Cloud**：https://cloud.sealos.io
2. **注册/登录**（支持微信、GitHub 等）
3. **充值**（最低 10 元，可用很久）

### 步骤 2：创建 PostgreSQL 数据库

1. **进入 Sealos 控制台**
2. **点击左侧 "数据库"**
3. **点击 "新建数据库"**
4. **配置**：
   - 数据库类型：**PostgreSQL**
   - 版本：**14.x**
   - CPU：**0.5 核**
   - 内存：**512 MB**
   - 存储：**1 GB**
   - 数据库名：`coffee_shop`
   - 用户名：`coffee_admin`
   - 密码：自动生成（记下来）
5. **点击 "创建"**
6. **等待创建完成**（1-2 分钟）
7. **获取连接信息**：
   - 点击数据库 → 详情
   - 复制 **内网地址**（类似：`postgresql-xxx.ns-xxx.svc:5432`）
   - 复制 **连接字符串**（类似：`postgresql://user:pass@host:5432/dbname`）

### 步骤 3：初始化数据库

1. **点击数据库 → 终端**
2. **连接到数据库**：
   ```sql
   \c coffee_shop
   ```
3. **执行初始化脚本**（将 SQLite 的建表语句转换为 PostgreSQL）：

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 可用时间表
CREATE TABLE available_times (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  week_start DATE NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 班次表
CREATE TABLE shifts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 打卡记录表
CREATE TABLE clock_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  shift_id INTEGER,
  clock_in TIMESTAMP,
  clock_out TIMESTAMP,
  is_anomaly BOOLEAN DEFAULT FALSE,
  admin_approved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- 请假申请表
CREATE TABLE shift_change_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  reason TEXT,
  new_start_time VARCHAR(10),
  new_end_time VARCHAR(10),
  status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- 通知表
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 班次需求表
CREATE TABLE shift_requirements (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  required_staff INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统设置表
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认用户
INSERT INTO users (username, password, name, role, hourly_rate) VALUES
('admin', '$2a$10$5Z8qN.Z8qN.Z8qN.Z8qN.eMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '管理员', 'admin', 0),
('emp001', '$2a$10$5Z8qN.Z8qN.Z8qN.Z8qN.eMhWGLxYvY3vY3vY3vY3vY3vY3vY3vY', '员工001', 'employee', 50);
```

### 步骤 4：部署后端

1. **返回 Sealos 首页**
2. **点击 "应用管理"**
3. **点击 "新建应用"**
4. **配置后端应用**：

   **基本信息**：
   - 应用名：`coffee-backend`
   - 镜像名：`node:18-alpine`（暂时填这个，后面会用自定义）
   - CPU：**0.5 核**
   - 内存：**512 MB**
   - 容器数：**1**

   **部署方式**：选择 **"从代码仓库"**
   - 代码仓库：`https://github.com/Spanrua/coffee-shop-schedule.git`
   - 分支：`main`
   - 代码目录：`backend`
   - 构建命令：`npm install && npm run build`
   - 启动命令：`npm start`
   - 端口：`3000`

5. **环境变量**（点击 "高级配置" → "环境变量"）：
   ```
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key-change-this
   PORT=3000
   DATABASE_URL=postgresql://coffee_admin:密码@postgresql-xxx.ns-xxx.svc:5432/coffee_shop
   ```
   ⚠️ 替换为你的实际数据库连接字符串！

6. **网络配置**：
   - 启用 "公网访问"
   - 协议：HTTP
   - 容器端口：3000
   - 自动生成域名

7. **点击 "部署"**

8. **等待部署完成**（3-5 分钟）

9. **获取后端域名**：
   - 部署成功后，点击应用
   - 查看 "外网地址"
   - 类似：`https://coffee-backend-xxx.cloud.sealos.io`
   - **记下这个域名**

### 步骤 5：部署前端

#### 5.1 更新前端配置

在本地修改 `frontend/.env.production`：

```env
VITE_API_URL=https://coffee-backend-xxx.cloud.sealos.io/api
```

替换为你的后端域名！

#### 5.2 提交并推送

```bash
cd d:\2026_backend_yjl\coffee-shop-scheduling
git add frontend/.env.production
git commit -m "更新 Sealos 后端 API 地址"
git push
```

#### 5.3 在 Sealos 部署前端

1. **点击 "应用管理" → "新建应用"**
2. **配置前端应用**：

   **基本信息**：
   - 应用名：`coffee-frontend`
   - CPU：**0.2 核**
   - 内存：**256 MB**

   **部署方式**：选择 **"从代码仓库"**
   - 代码仓库：`https://github.com/Spanrua/coffee-shop-schedule.git`
   - 分支：`main`
   - 代码目录：`frontend`
   - 构建命令：`npm install && npm run build`
   - 输出目录：`dist`

3. **环境变量**：
   ```
   VITE_API_URL=https://coffee-backend-xxx.cloud.sealos.io/api
   ```

4. **网络配置**：
   - 启用 "公网访问"
   - 协议：HTTP
   - 容器端口：80（Sealos 会自动用 Nginx 服务静态文件）

5. **点击 "部署"**

6. **获取前端域名**：
   - 类似：`https://coffee-frontend-xxx.cloud.sealos.io`

### 步骤 6：更新后端 CORS

#### 6.1 修改 CORS 配置

编辑 `backend/src/server.ts`：

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://coffee-frontend-xxx.cloud.sealos.io',  // 你的前端域名
  ],
  credentials: true
}));
```

#### 6.2 提交并推送

```bash
git add backend/src/server.ts
git commit -m "更新 CORS 配置"
git push
```

Sealos 会自动重新部署后端！

---

## 💰 Sealos 费用估算

### 按小时计费（自动扣费）

**后端**（0.5核 + 512MB）：
- 约 ¥0.05/小时
- 约 ¥1.2/天
- 约 ¥36/月

**前端**（0.2核 + 256MB）：
- 约 ¥0.02/小时
- 约 ¥0.5/天
- 约 ¥15/月

**数据库**（0.5核 + 512MB + 1GB存储）：
- 约 ¥0.04/小时
- 约 ¥1/天
- 约 ¥30/月

**总计**：约 ¥81/月

### 成本优化
- 可以设置自动休眠（长时间无访问自动停止）
- 按实际使用量计费，不用不扣费

---

## 📝 部署检查清单

### 数据库
- [ ] PostgreSQL 创建成功
- [ ] 数据库初始化完成
- [ ] 获取连接字符串

### 后端
- [ ] 代码推送到 GitHub
- [ ] Sealos 后端应用创建
- [ ] 环境变量配置（DATABASE_URL）
- [ ] 部署状态为"运行中"
- [ ] 后端域名获取

### 前端
- [ ] 更新 API 地址
- [ ] 代码推送到 GitHub
- [ ] Sealos 前端应用创建
- [ ] 环境变量配置
- [ ] 部署状态为"运行中"
- [ ] 前端域名获取

### 功能测试
- [ ] 访问前端域名
- [ ] 管理员登录
- [ ] 员工登录
- [ ] 查看排班
- [ ] 提交请假
- [ ] 打卡功能

---

## 🎯 Sealos vs 其他平台

| 特性 | Sealos | Zeabur | Vercel |
|------|--------|--------|--------|
| 国内访问 | 🚀 非常快 | ⚠️ 一般 | ❌ 较慢 |
| 全栈支持 | ✅ | ✅ | ❌ |
| 数据库 | ✅ 内置 | ⚠️ 需外部 | ❌ |
| 价格 | ¥81/月 | $5/月 | 免费 |
| 配置难度 | 简单 | 简单 | 简单 |
| 按需计费 | ✅ | ❌ | ❌ |

---

## 🔗 相关链接

- **Sealos Cloud**：https://cloud.sealos.io
- **Sealos 文档**：https://sealos.io/docs
- **GitHub 仓库**：https://github.com/Spanrua/coffee-shop-schedule

---

准备好开始在 Sealos 部署了吗？让我知道你进行到哪一步！🚀
