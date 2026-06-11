# ☕ 咖啡店排班与打卡系统

一个为小型咖啡店设计的完整排班和打卡管理系统，支持员工提交可用时间、自动排班、打卡记录和工资导出。

## ✨ 功能特性

### 员工功能
- 📅 **提交可用时间**：每周六提交下周可工作的时间段
- 📋 **查看排班**：查看个人排班安排
- ⏰ **上下班打卡**：在今日排班页面进行打卡
- 📊 **打卡记录查询**：查看历史打卡记录
- 🔄 **申请班次变更**：提交换班、请假申请

### 管理员功能
- 👥 **员工管理**：添加、编辑、删除员工账户
- 🤖 **自动排班**：根据员工可用时间和需求配置自动生成排班
- ✏️ **手动调整排班**：灵活调整自动生成的排班
- 👀 **实时监控**：查看当前在岗人员
- 📝 **打卡记录管理**：查看、修改、补录打卡记录
- ✅ **审批变更申请**：处理员工的班次变更请求
- 💰 **工资管理**：基于打卡记录自动计算工资并导出Excel/CSV

### 核心特点
- 🎯 **智能排班算法**：公平分配工时，满足最低人员需求
- ⚠️ **异常检测**：自动标记打卡时间与排班时间差距过大的记录
- 💵 **灵活工资计算**：支持加班费、周末工资倍数等规则
- 📱 **响应式设计**：支持手机和电脑访问
- 🐳 **一键部署**：使用Docker Compose快速启动

## 🏗️ 技术架构

### 后端
- **运行时**: Node.js 18+
- **框架**: Express + TypeScript
- **数据库**: SQLite3（轻量级，无需额外配置）
- **认证**: JWT (JSON Web Tokens)
- **密码加密**: bcrypt
- **Excel导出**: ExcelJS

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **路由**: React Router v6
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios
- **日期处理**: date-fns
- **图标**: Lucide React

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

1. **克隆或下载项目**
```bash
cd coffee-shop-scheduling
```

2. **使用Docker Compose启动**
```bash
docker-compose up --build
```

3. **访问应用**
- 前端地址: http://localhost
- 后端API: http://localhost:3000

### 方式二：本地运行

#### 后端启动

1. **进入后端目录**
```bash
cd backend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑.env文件，修改JWT_SECRET等配置
```

4. **启动后端服务**
```bash
npm run dev
```

后端将在 http://localhost:3000 运行，数据库会自动初始化。

#### 前端启动

1. **进入前端目录**
```bash
cd frontend
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 确保VITE_API_URL指向后端地址
```

4. **启动前端开发服务器**
```bash
npm run dev
```

前端将在 http://localhost:5173 运行。

## 👤 默认账号

系统初始化时会自动创建以下测试账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 拥有所有权限 |
| 员工 | employee1 | employee123 | 普通员工账号 |
| 员工 | employee2 | employee123 | 普通员工账号 |
| 员工 | employee3 | employee123 | 普通员工账号 |

⚠️ **生产环境请务必修改默认密码！**

## 📖 使用指南

### 员工端操作流程

1. **登录系统**
   - 使用员工账号登录（如 employee1 / employee123）

2. **提交可用时间**
   - 每周六提交下周（周一至周日）的可工作时间段
   - 可以选择多个不连续的时间段
   - 逾期未提交视为下周完全不可用

3. **查看排班**
   - 周日晚前会收到下周的排班通知
   - 在"今日排班"页面查看当天的班次

4. **上下班打卡**
   - 在排班时间内点击"上班打卡"按钮
   - 下班时点击"下班打卡"按钮
   - 系统会自动记录打卡时间

5. **申请班次变更**（可选）
   - 如需调整班次，可在排班日期前一天提交申请
   - 管理员审批后生效

### 管理员端操作流程

1. **登录管理后台**
   - 使用管理员账号登录（admin / admin123）

2. **员工管理**
   - 添加新员工账号
   - 设置员工时薪
   - 启用/禁用员工账号

3. **配置班次需求**
   - 设置每天各时段需要的最少人数
   - 默认：早班(8:00-12:00)、午班(12:00-16:00)、晚班(16:00-20:00)各2人

4. **自动排班**
   - 每周日晚前，点击"生成排班"
   - 系统根据员工可用时间自动分配
   - 如有无法满足的时段会提示警告

5. **手动调整排班**
   - 可以修改、删除、添加班次
   - 调整后员工可立即看到更新

6. **监控打卡**
   - 实时查看当前在岗人员
   - 查看所有打卡记录
   - 补录遗漏的打卡记录
   - 处理异常打卡

7. **导出工资表**
   - 选择日期范围（默认一周）
   - 系统自动计算工资
   - 支持导出Excel或CSV格式

## ⚙️ 系统配置

### 班次配置

默认班次设置：
- **营业时间**: 8:00 - 20:00
- **班次划分**: 
  - 早班：8:00 - 12:00
  - 午班：12:00 - 16:00
  - 晚班：16:00 - 20:00
- **每班最少人数**: 2人

管理员可在系统配置中修改这些设置。

### 工资计算规则

默认规则（可在系统配置中修改）：
- **基础时薪**: 50元/小时（可按员工设置）
- **工作日加班**: 超过8小时的部分按1.5倍计算
- **周末工资**: 全部按1.5倍计算
- **周总工时加班**: 超过40小时的部分按2倍计算
- **未打卡**: 使用排班时间估算并标记

### 打卡异常判定

以下情况会被标记为异常：
- 打卡时间与排班时间相差超过2小时
- 没有对应的排班记录却进行打卡
- 上班打卡但超过12小时未下班打卡

异常记录需要管理员审核确认。

## 🗂️ 项目结构

```
coffee-shop-scheduling/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── middleware/        # 中间件（认证、错误处理）
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # API路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   ├── db.ts              # 数据库连接
│   │   └── server.ts          # 服务器入口
│   ├── database/
│   │   ├── schema.sql         # 数据库结构
│   │   └── seed.sql           # 初始数据
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── pages/             # 页面组件
│   │   ├── contexts/          # Context API
│   │   ├── services/          # API调用
│   │   ├── types/             # TypeScript类型
│   │   ├── App.tsx            # 主应用
│   │   └── main.tsx           # 入口文件
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml          # Docker编排配置
└── README.md                   # 本文件
```

## 🔌 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/users` - 获取所有用户（管理员）
- `POST /api/users` - 创建用户（管理员）
- `PUT /api/users/:id` - 更新用户（管理员）
- `DELETE /api/users/:id` - 删除用户（管理员）

### 可用时间
- `POST /api/available-times` - 提交可用时间
- `GET /api/available-times/my/:weekStart` - 获取我的可用时间
- `GET /api/available-times/all/:weekStart` - 获取所有可用时间（管理员）

### 排班管理
- `POST /api/shifts/generate` - 自动生成排班（管理员）
- `GET /api/shifts` - 查询排班
- `GET /api/shifts/my` - 获取我的排班
- `GET /api/shifts/today` - 获取今日排班
- `POST /api/shifts` - 创建班次（管理员）
- `PUT /api/shifts/:id` - 更新班次（管理员）
- `DELETE /api/shifts/:id` - 删除班次（管理员）

### 打卡管理
- `POST /api/clock/in` - 上班打卡
- `POST /api/clock/out` - 下班打卡
- `GET /api/clock/today` - 获取今日打卡记录
- `GET /api/clock/my` - 获取我的打卡历史
- `GET /api/clock/records` - 获取所有打卡记录（管理员）
- `PUT /api/clock/records/:id` - 修改打卡记录（管理员）
- `GET /api/clock/on-duty` - 获取当前在岗人员

### 工资管理
- `GET /api/payroll` - 查询工资数据
- `GET /api/payroll/export` - 导出工资表（管理员）

### 系统配置
- `GET /api/config/shift-requirements` - 获取班次需求配置
- `PUT /api/config/shift-requirements` - 更新班次需求配置（管理员）
- `GET /api/config/settings` - 获取系统设置
- `PUT /api/config/settings` - 更新系统设置（管理员）

## 🔧 开发说明

### 后端开发
```bash
cd backend
npm run dev        # 启动开发服务器（热重载）
npm run build      # 编译TypeScript
npm start          # 启动生产服务器
```

### 前端开发
```bash
cd frontend
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览生产构建
```

## 🐛 常见问题

### 1. 端口冲突
如果3000或80端口被占用，可以在docker-compose.yml中修改端口映射：
```yaml
ports:
  - "3001:3000"  # 将后端映射到3001端口
```

### 2. 数据库位置
SQLite数据库文件位于 `backend/database/coffee-shop.db`，可以使用SQLite客户端直接查看。

### 3. 忘记管理员密码
删除数据库文件后重新启动，系统会重新初始化并创建默认账号：
```bash
rm backend/database/coffee-shop.db
```

### 4. 打卡时间不准确
确保服务器时区设置正确，系统使用服务器本地时间。

## 📝 待办事项

- [ ] 添加消息通知功能
- [ ] 支持多门店管理
- [ ] 添加移动端APP
- [ ] 支持指纹/人脸打卡
- [ ] 添加考勤统计报表
- [ ] 支持班次模板
- [ ] 添加请假审批流程

## 📄 许可证

MIT License

## 👨‍💻 开发者

本项目基于需求文档开发，使用现代Web技术栈构建。

## 🙏 致谢

感谢所有开源项目的贡献者！

---

如有问题或建议，欢迎提Issue或Pull Request！
