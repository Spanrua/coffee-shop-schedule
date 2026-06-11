# 📚 咖啡店排班打卡系统 - 完整索引

## 🎯 快速导航

### 🚀 立即开始
- **最快启动**: 双击 [`docker-start.bat`](docker-start.bat)
- **管理控制台**: 双击 [`docker-manager.bat`](docker-manager.bat)
- **快速指南**: 阅读 [`QUICK_START_DOCKER.md`](QUICK_START_DOCKER.md)

### 📖 核心文档
- [`README.md`](README.md) - 完整项目文档
- [`GETTING_STARTED.md`](GETTING_STARTED.md) - 快速开始指南
- [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) - 项目交付总结

---

## 📂 项目结构

```
coffee-shop-scheduling/
├── 🚀 快捷启动脚本
│   ├── docker-start.bat          一键启动系统
│   ├── docker-stop.bat           停止所有服务
│   ├── docker-manager.bat        主控制台（推荐）
│   ├── docker-status.bat         查看容器状态
│   ├── docker-logs.bat           查看日志
│   ├── start.bat                 本地运行（Windows）
│   └── start.sh                  本地运行（Linux/Mac）
│
├── 📖 文档目录
│   ├── README.md                 完整项目文档
│   ├── GETTING_STARTED.md        快速开始
│   ├── QUICK_START_DOCKER.md     Docker快速指南
│   ├── PROJECT_SUMMARY.md        项目总结
│   ├── TESTING.md                测试指南
│   ├── DOCKER_SCRIPTS.md         Docker脚本详解
│   ├── DOCKER_INTEGRATION.md     Docker集成方案
│   ├── WINDOWS_SETUP.md          Windows安装说明
│   └── INDEX.md                  本文件（索引）
│
├── 🔧 配置文件
│   └── docker-compose.yml        Docker编排配置
│
├── 💻 后端代码
│   ├── src/
│   │   ├── routes/              API路由（7个模块）
│   │   ├── middleware/          中间件
│   │   ├── models/              数据模型
│   │   ├── config/              配置
│   │   ├── db.ts                数据库连接
│   │   └── server.ts            服务器入口
│   ├── database/
│   │   ├── schema.sql           数据库结构
│   │   └── seed.sql             初始数据
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
└── 🌐 前端代码
    ├── src/
    │   ├── pages/               页面组件
    │   ├── components/          UI组件
    │   ├── contexts/            状态管理
    │   ├── services/            API服务
    │   ├── types/               类型定义
    │   ├── App.tsx              主应用
    │   └── main.tsx             入口文件
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── .env.example
    ├── nginx.conf
    └── Dockerfile
```

---

## 🎮 使用方式分类

### 初次使用者 👶

**推荐路径**:
1. 阅读 [`QUICK_START_DOCKER.md`](QUICK_START_DOCKER.md) - 5分钟
2. 双击 [`docker-start.bat`](docker-start.bat) - 启动系统
3. 登录测试: admin / admin123
4. 体验功能

### 日常使用者 👨‍💼

**快速操作**:
- 启动: 双击 `docker-start.bat`
- 管理: 双击 `docker-manager.bat`
- 停止: 双击 `docker-stop.bat`

### 开发者 👨‍💻

**开发文档**:
1. [`README.md`](README.md) - 完整技术文档
2. [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) - 架构说明
3. [`TESTING.md`](TESTING.md) - API测试
4. 源代码: `backend/src/` 和 `frontend/src/`

### 管理员 👑

**运维文档**:
1. [`DOCKER_SCRIPTS.md`](DOCKER_SCRIPTS.md) - 脚本详解
2. [`WINDOWS_SETUP.md`](WINDOWS_SETUP.md) - 环境配置
3. [`DOCKER_INTEGRATION.md`](DOCKER_INTEGRATION.md) - 集成方案

---

## 📋 功能清单

### ✅ 已实现功能

#### 员工端
- [x] 用户登录认证
- [x] 查看今日排班
- [x] 上班打卡
- [x] 下班打卡
- [x] 查看打卡历史
- [x] 查看在岗人员

#### 管理员端
- [x] 员工管理（增删改查）
- [x] 手动创建/编辑排班
- [x] 自动生成排班
- [x] 查看所有打卡记录
- [x] 补录/修改打卡
- [x] 异常打卡处理
- [x] 实时在岗监控
- [x] 工资计算
- [x] 工资表导出（Excel/CSV）
- [x] 系统配置管理

#### 技术特性
- [x] JWT认证
- [x] 密码加密
- [x] 响应式设计
- [x] Docker部署
- [x] RESTful API
- [x] TypeScript类型安全

---

## 🔍 快速查找

### 我想...

#### 启动系统
→ 双击 [`docker-start.bat`](docker-start.bat)
→ 或查看 [`QUICK_START_DOCKER.md`](QUICK_START_DOCKER.md)

#### 查看状态
→ 双击 [`docker-status.bat`](docker-status.bat)

#### 查看日志
→ 双击 [`docker-logs.bat`](docker-logs.bat)

#### 停止系统
→ 双击 [`docker-stop.bat`](docker-stop.bat)

#### 了解功能
→ 阅读 [`README.md`](README.md)
→ 阅读 [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)

#### 测试API
→ 阅读 [`TESTING.md`](TESTING.md)

#### 解决问题
→ 查看 [`WINDOWS_SETUP.md`](WINDOWS_SETUP.md)
→ 查看 [`QUICK_START_DOCKER.md`](QUICK_START_DOCKER.md) 的故障排查章节

#### 修改代码
→ 查看 `backend/src/` 目录
→ 查看 `frontend/src/` 目录
→ 阅读 [`README.md`](README.md) 的开发说明章节

#### 查看数据库
→ 使用 SQLite 工具打开 `backend/database/coffee-shop.db`
→ 查看 `backend/database/schema.sql` 了解结构

---

## 🎓 学习路径

### 路径1: 快速使用（15分钟）
```
1. QUICK_START_DOCKER.md    (5分钟)
2. 启动并登录系统           (5分钟)
3. 测试打卡功能              (5分钟)
```

### 路径2: 完整了解（1小时）
```
1. README.md                 (20分钟)
2. PROJECT_SUMMARY.md        (15分钟)
3. TESTING.md                (15分钟)
4. 实际操作测试              (10分钟)
```

### 路径3: 深入开发（3小时）
```
1. 阅读所有文档              (1小时)
2. 查看后端代码              (1小时)
3. 查看前端代码              (1小时)
```

---

## 🧰 工具箱

### Docker管理脚本
| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| `docker-start.bat` | 一键启动 | 每天开始工作 |
| `docker-stop.bat` | 停止服务 | 下班关闭 |
| `docker-manager.bat` | 主控制台 | 管理和调试 |
| `docker-status.bat` | 查看状态 | 检查运行情况 |
| `docker-logs.bat` | 查看日志 | 排查问题 |

### 本地运行脚本
| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| `start.bat` | Windows本地启动 | 开发环境 |
| `start.sh` | Linux/Mac本地启动 | 开发环境 |

---

## 📊 项目统计

- **总代码量**: ~5,300行
- **核心文件**: 50+ 个
- **API接口**: 30+ 个
- **数据表**: 7 张
- **文档**: 9 份完整文档
- **快捷脚本**: 7 个

---

## 🔗 重要链接

### 外部资源
- **Docker官网**: https://www.docker.com/
- **Docker Desktop下载**: https://www.docker.com/products/docker-desktop
- **Node.js官网**: https://nodejs.org/
- **React文档**: https://react.dev/

### 技术栈文档
- **Express**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 💡 提示

### 第一次使用
1. 确保Docker Desktop已安装并运行
2. 双击 `docker-start.bat` 启动
3. 等待5-10分钟（首次下载依赖）
4. 浏览器自动打开

### 日常使用
1. 启动Docker Desktop
2. 双击 `docker-start.bat`
3. 等待10-20秒即可使用

### 遇到问题
1. 查看 `QUICK_START_DOCKER.md` 的常见问题章节
2. 运行 `docker-logs.bat` 查看日志
3. 运行 `docker-status.bat` 检查状态

---

## 🎉 开始使用

### 现在就开始！

**3步启动**:
```
1. 启动 Docker Desktop
2. 双击 docker-start.bat
3. 登录 admin / admin123
```

**需要帮助？**
- 快速入门: [`QUICK_START_DOCKER.md`](QUICK_START_DOCKER.md)
- 完整文档: [`README.md`](README.md)
- 问题排查: [`WINDOWS_SETUP.md`](WINDOWS_SETUP.md)

---

## 📞 技术支持

如有问题：
1. 查看相关文档
2. 检查Docker状态
3. 查看日志文件
4. 搜索错误信息

---

**项目版本**: 1.0.0  
**最后更新**: 2026-06-11  
**状态**: ✅ 可部署运行

---

祝您使用愉快！☕🎉
