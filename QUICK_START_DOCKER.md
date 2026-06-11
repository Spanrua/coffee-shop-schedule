# 🚀 快速启动指南 - Docker版本

## ✅ 前提条件

1. **安装Docker Desktop**
   - 下载地址: https://www.docker.com/products/docker-desktop
   - 安装后重启电脑
   - 启动Docker Desktop（等待图标变绿）

2. **验证Docker安装**
   ```bash
   docker --version
   docker-compose --version
   ```

## 🎯 三种启动方式

### 方式1: 一键启动（最简单）⭐⭐⭐⭐⭐

**直接双击** `docker-start.bat`

- ✅ 自动检查Docker状态
- ✅ 自动启动所有服务
- ✅ 3秒后自动打开浏览器
- ✅ 显示登录信息

### 方式2: 使用管理控制台（功能最全）⭐⭐⭐⭐⭐

**双击** `docker-manager.bat`

提供完整的菜单界面：
```
1. Start System          - 启动系统
2. Stop System           - 停止系统
3. Restart System        - 重启系统
4. View Container Status - 查看状态
5. View All Logs         - 查看所有日志
6. View Backend Logs     - 查看后端日志
7. View Frontend Logs    - 查看前端日志
8. Rebuild and Start     - 重新构建
9. Stop and Clean Data   - 清理数据
10. Open Web Browser     - 打开网页
```

### 方式3: 命令行方式

```bash
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker-compose up -d --build
```

## 📖 使用流程

### 第一次启动（完整流程）

1. **启动Docker Desktop**
   - 在开始菜单找到"Docker Desktop"
   - 运行并等待图标变绿（右下角托盘）

2. **运行启动脚本**
   ```
   双击 docker-start.bat
   ```

3. **等待构建完成**
   - 第一次启动需要下载依赖
   - 大约需要5-10分钟
   - 看到 "Success!" 表示启动完成

4. **访问系统**
   - 浏览器会自动打开 http://localhost
   - 如果没有，手动访问该地址

5. **登录系统**
   ```
   管理员账号:
   用户名: admin
   密码: admin123

   员工账号:
   用户名: employee1
   密码: employee123
   ```

### 后续启动（快速流程）

```
1. 确保Docker Desktop运行中
2. 双击 docker-start.bat
3. 等待10-20秒
4. 浏览器自动打开
```

## 🛠️ 常用操作

### 查看系统状态
```
双击 docker-status.bat
```

### 查看日志（排查问题）
```
双击 docker-logs.bat
→ 选择 1 (后端日志)
→ 选择 2 (前端日志)
→ 选择 3 (所有日志)
```

### 停止系统
```
双击 docker-stop.bat
```

### 重新构建（代码更新后）
```
双击 docker-manager.bat
→ 输入 8
```

## 🎮 测试场景

### 场景1: 员工打卡测试

1. **管理员登录** (admin / admin123)
   - 进入管理员控制台
   - 点击"排班管理"
   - 添加今天的班次给 employee1

2. **员工登录** (employee1 / employee123)
   - 进入员工工作台
   - 看到今日排班
   - 点击"上班打卡"
   - 稍后点击"下班打卡"

3. **验证结果**
   - 管理员查看"打卡记录"
   - 可以看到employee1的打卡

### 场景2: 工资导出测试

1. **管理员登录**
2. **点击"工资管理"**
3. **选择日期范围**
4. **点击"导出Excel"**

## ⚠️ 常见问题

### 问题1: "Docker is not running"
**原因**: Docker Desktop未启动

**解决**:
1. 启动Docker Desktop
2. 等待右下角图标变绿
3. 重新运行脚本

### 问题2: 端口被占用
**错误**: "port is already allocated"

**解决**:
```
方法1: 停止占用端口的程序
方法2: 修改端口（编辑docker-compose.yml）
  backend:
    ports:
      - "3001:3000"  # 改为3001
  frontend:
    ports:
      - "8080:80"    # 改为8080
```

### 问题3: 启动失败
**解决步骤**:
1. 双击 `docker-logs.bat`
2. 选择查看后端或前端日志
3. 查找错误信息
4. 根据错误提示解决

### 问题4: 浏览器无法访问
**解决**:
1. 运行 `docker-status.bat` 确认容器运行
2. 访问 http://localhost:3000/health 检查后端
3. 检查防火墙是否阻止
4. 尝试重启Docker

### 问题5: 需要清理重来
**解决**:
```
双击 docker-manager.bat
→ 输入 9 (清理所有数据)
→ 输入 Y 确认
→ 输入 8 (重新构建)
```

## 📊 系统验证

### 1. 检查容器状态
```bash
docker ps
```
应该看到2个容器：
- coffee-shop-backend
- coffee-shop-frontend

### 2. 检查后端健康
访问: http://localhost:3000/health
应该返回: `{"status":"ok","timestamp":"..."}`

### 3. 检查前端
访问: http://localhost
应该看到登录页面

### 4. 检查日志
```
双击 docker-logs.bat
选择相应服务查看日志
```

## 💡 实用技巧

### 1. 开机自动启动
将 `docker-start.bat` 快捷方式放到启动文件夹：
```
Win + R → 输入 shell:startup → 回车
拖入快捷方式
```

### 2. 创建桌面快捷方式
```
右键脚本 → 发送到 → 桌面快捷方式
```

### 3. 后台静默运行
如果不想看到命令行窗口：
```
创建 docker-start-silent.vbs:
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "docker-start.bat", 0, False
```

## 📝 日常使用工作流

### 早上开始工作
```
1. 启动Docker Desktop
2. 双击 docker-start.bat
3. 等待浏览器打开
4. 开始使用
```

### 使用过程中
```
- 正常操作: 打卡、排班等
- 遇到问题: docker-logs.bat 查看日志
- 需要重启: docker-manager.bat → 选项3
```

### 下班关闭
```
双击 docker-stop.bat
```

## 🎯 性能优化建议

### 1. 分配更多资源给Docker
```
Docker Desktop → Settings → Resources
增加 CPU 和 Memory
```

### 2. 清理未使用的镜像
```bash
docker system prune -a
```

### 3. 定期重启Docker
每周重启一次Docker Desktop可以保持最佳性能

## 📚 更多资源

- **完整文档**: `README.md`
- **脚本详解**: `DOCKER_SCRIPTS.md`
- **集成方案**: `DOCKER_INTEGRATION.md`
- **测试指南**: `TESTING.md`
- **项目总结**: `PROJECT_SUMMARY.md`

## 🆘 获取帮助

如果遇到其他问题：
1. 查看相关文档
2. 检查Docker Desktop日志
3. 运行 `docker-logs.bat` 查看应用日志
4. 搜索错误信息

## ✅ 成功标志

当您看到以下内容时，表示系统已成功启动：

1. **命令行输出**:
   ```
   ========================================
          Success!
   ========================================
   [WEB] Frontend: http://localhost
   [API] Backend:  http://localhost:3000
   ```

2. **浏览器自动打开** 登录页面

3. **可以成功登录** admin / admin123

4. **docker-status.bat 显示**:
   ```
   coffee-shop-backend     Up 2 minutes
   coffee-shop-frontend    Up 2 minutes
   ```

---

## 🎉 开始使用

现在您已经了解了所有使用方法，可以：

1. ✅ 双击 `docker-start.bat` 启动系统
2. ✅ 使用 admin / admin123 登录
3. ✅ 开始体验所有功能！

**祝您使用愉快！** ☕🚀
