# 快速测试指南

## 快速启动

### Windows用户
双击运行 `start.bat` 文件，脚本会自动完成以下操作：
1. 检查Node.js环境
2. 安装依赖
3. 启动后端和前端服务

### Linux/Mac用户
```bash
chmod +x start.sh
./start.sh
```

### 使用Docker
```bash
docker-compose up --build
```

## 测试流程

### 第一步：登录系统

**访问地址**: http://localhost:5173 (本地运行) 或 http://localhost (Docker)

#### 测试管理员功能
- 用户名: `admin`
- 密码: `admin123`

#### 测试员工功能
- 用户名: `employee1`
- 密码: `employee123`

### 第二步：员工端测试

1. **使用employee1账号登录**

2. **查看首页**
   - 应该看到"今日排班"（首次使用可能为空）
   - 右侧显示"当前在岗人员"

3. **提交可用时间**（功能未在基础版本中实现，需要后续开发）
   - 点击快捷菜单中的"提交可用时间"
   - 选择下周的日期范围
   - 为每天添加可工作的时间段

4. **测试打卡功能**
   - 如果今天有排班，会看到班次卡片
   - 点击"上班打卡"按钮
   - 成功后可以看到打卡时间
   - 点击"下班打卡"按钮完成下班打卡

### 第三步：管理员端测试

1. **使用admin账号登录**

2. **查看管理员仪表盘**
   - 看到统计数据：员工总数、当前在岗、今日班次
   - 查看在岗人员列表
   - 查看今日排班列表

3. **员工管理**
   - 点击"员工管理"
   - 查看所有员工列表
   - 添加新员工
   - 编辑员工信息（修改时薪等）

4. **排班管理**
   - 点击"排班管理"
   - 选择日期范围查看排班
   - 手动添加班次
   - 编辑或删除班次

5. **打卡记录管理**
   - 点击"打卡记录"
   - 查看所有员工的打卡记录
   - 筛选特定员工或日期范围
   - 修改或补录打卡记录
   - 处理异常打卡

6. **工资管理**
   - 点击"工资管理"
   - 选择日期范围（如本周）
   - 查看工资计算结果
   - 点击"导出Excel"或"导出CSV"

## 测试场景

### 场景1：完整的打卡流程

1. **管理员操作**:
   ```
   admin登录 → 排班管理 → 手动添加今天的班次
   - 员工: employee1
   - 日期: 今天
   - 时间: 09:00 - 13:00
   ```

2. **员工操作**:
   ```
   employee1登录 → 首页 → 上班打卡 → 下班打卡
   ```

3. **验证结果**:
   ```
   admin登录 → 打卡记录 → 查看employee1的打卡记录
   ```

### 场景2：异常打卡测试

1. **创建一个早上8点的班次**

2. **中午12点进行上班打卡**
   - 系统应该标记为"异常"（超过2小时阈值）

3. **管理员查看并处理**
   - 打卡记录页面会显示异常标记
   - 可以审核通过或修改打卡时间

### 场景3：工资计算测试

1. **创建多个打卡记录**:
   ```
   周一: 8:00-12:00 (4小时)
   周二: 8:00-18:00 (10小时，含2小时加班)
   周六: 10:00-14:00 (4小时周末)
   ```

2. **导出工资表**:
   - 选择本周日期范围
   - 查看计算结果：
     - 正常工时
     - 加班工资
     - 周末工资
     - 总工资

3. **验证计算**:
   ```
   周一: 4小时 × 50元 = 200元
   周二: 8小时 × 50元 + 2小时 × 50元 × 1.5 = 550元
   周六: 4小时 × 50元 × 1.5 = 300元
   总计: 1050元
   ```

## API测试

### 使用curl测试API

1. **登录获取token**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

2. **获取当前用户信息**:
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **获取今日排班**:
```bash
curl http://localhost:3000/api/shifts/today \
  -H "Authorization: Bearer YOUR_TOKEN"
```

4. **上班打卡**:
```bash
curl -X POST http://localhost:3000/api/clock/in \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shift_id":1}'
```

## 数据库查看

SQLite数据库文件位置: `backend/database/coffee-shop.db`

### 使用SQLite命令行工具
```bash
cd backend/database
sqlite3 coffee-shop.db

# 查看所有表
.tables

# 查看用户
SELECT * FROM users;

# 查看今天的班次
SELECT * FROM shifts WHERE date = date('now');

# 查看打卡记录
SELECT * FROM clock_records;
```

### 使用GUI工具
推荐使用以下工具查看数据库：
- **DB Browser for SQLite** (跨平台)
- **SQLiteStudio** (跨平台)
- **DBeaver** (跨平台)

## 常见问题排查

### 1. 前端无法连接后端
- 检查后端是否启动: `http://localhost:3000/health`
- 检查前端.env配置: `VITE_API_URL=http://localhost:3000/api`

### 2. 登录失败
- 检查数据库是否初始化
- 查看后端日志
- 确认密码正确

### 3. 打卡按钮不显示
- 确保今天有排班
- 检查浏览器控制台错误信息
- 刷新页面重新获取数据

### 4. 工资计算不正确
- 检查系统配置中的工资规则
- 确认打卡记录完整
- 查看是否有异常打卡

## 性能测试

### 创建测试数据
```sql
-- 批量创建员工
INSERT INTO users (username, password_hash, name, role, hourly_rate) 
VALUES 
  ('emp1', '$2b$10$...', '员工1', 'employee', 50),
  ('emp2', '$2b$10$...', '员工2', 'employee', 55),
  ('emp3', '$2b$10$...', '员工3', 'employee', 60);

-- 批量创建班次
INSERT INTO shifts (user_id, date, start_time, end_time, status)
VALUES 
  (2, '2026-06-11', '08:00', '12:00', 'scheduled'),
  (3, '2026-06-11', '08:00', '12:00', 'scheduled'),
  (4, '2026-06-11', '12:00', '16:00', 'scheduled');
```

### 压力测试
```bash
# 使用Apache Bench测试
ab -n 1000 -c 10 http://localhost:3000/health

# 使用wrk测试
wrk -t4 -c100 -d30s http://localhost:3000/api/shifts/today
```

## 安全测试

### 1. 测试未授权访问
```bash
# 不带token访问受保护的接口（应返回401）
curl http://localhost:3000/api/users
```

### 2. 测试权限控制
```bash
# 员工尝试访问管理员接口（应返回403）
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

### 3. 测试SQL注入
尝试在登录表单中输入：
```
username: admin' OR '1'='1
password: anything
```
应该返回登录失败，而不是绕过认证。

## 浏览器兼容性

测试以下浏览器：
- ✅ Chrome/Edge (推荐)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11 (不支持)

## 移动端测试

使用移动设备或浏览器开发者工具测试：
- iPhone (Safari)
- Android (Chrome)
- iPad (Safari)

验证：
- 响应式布局正常
- 触摸操作流畅
- 表单输入方便

## 反馈问题

如果在测试中发现问题，请记录：
1. 复现步骤
2. 预期结果
3. 实际结果
4. 错误信息（浏览器控制台/后端日志）
5. 测试环境（操作系统、浏览器版本等）

---

祝测试顺利！如有问题请查看主README文档或提交Issue。
