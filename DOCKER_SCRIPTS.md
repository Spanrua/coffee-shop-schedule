# 🐳 Docker快捷脚本使用指南

## 📋 可用脚本列表

项目根目录下提供了以下Docker管理脚本：

### 🎮 主控制脚本（推荐）
- **`docker-manager.bat`** - Docker管理控制台（图形化菜单）
  - 一键启动/停止/重启
  - 查看状态和日志
  - 重新构建
  - 清理数据

### 🚀 快速操作脚本
- **`docker-start.bat`** - 启动系统（后台运行，自动打开浏览器）
- **`docker-stop.bat`** - 停止系统
- **`docker-status.bat`** - 查看容器状态
- **`docker-logs.bat`** - 查看日志（可选择服务）

## 🎯 快速开始

### 方式1: 使用主控制台（最推荐）

1. **双击运行** `docker-manager.bat`
2. **选择操作**：
   - 输入 `1` → 启动系统
   - 输入 `4` → 查看状态
   - 输入 `10` → 打开网页
3. **开始使用**

### 方式2: 单独脚本

**启动系统**:
```
双击 docker-start.bat
```
- 自动检查Docker状态
- 后台启动服务
- 3秒后自动打开浏览器

**停止系统**:
```
双击 docker-stop.bat
```

**查看状态**:
```
双击 docker-status.bat
```

**查看日志**:
```
双击 docker-logs.bat
```
- 可选择查看后端、前端或所有日志

## 📖 详细说明

### docker-manager.bat - 主控制台

提供完整的菜单界面，所有操作一目了然：

```
☕ 咖啡店排班打卡系统 - Docker控制台

【主要操作】
 1. 🚀 启动系统 (后台运行)
 2. 🛑 停止系统
 3. 🔄 重启系统

【查看状态】
 4. 📊 查看容器状态
 5. 📋 查看日志
 6. 💻 查看后端日志
 7. 🌐 查看前端日志

【高级操作】
 8. 🔧 重新构建并启动
 9. 🗑️  停止并清除数据
 10. 🌍 打开系统网页

 0. ❌ 退出
```

**使用示例**:
1. 启动系统 → 输入 `1`
2. 查看是否正常运行 → 输入 `4`
3. 如果有问题查看日志 → 输入 `6` 或 `7`
4. 打开网页开始使用 → 输入 `10`

### docker-start.bat - 快速启动

**功能**:
- ✅ 自动检查Docker是否运行
- ✅ 后台启动服务（不占用终端）
- ✅ 显示访问地址和测试账号
- ✅ 3秒后自动打开浏览器

**输出示例**:
```
✓ Docker已就绪

📦 正在启动服务（后台运行）...

╔════════════════════════════════════════╗
║          🎉 启动成功！                 ║
╚════════════════════════════════════════╝

🌐 前端地址: http://localhost
🔌 后端API: http://localhost:3000

👤 测试账号:
   管理员: admin / admin123
   员工: employee1 / employee123
```

### docker-stop.bat - 停止服务

**功能**:
- 停止所有运行中的容器
- 保留数据（不删除数据库）

**使用场景**:
- 下班关闭服务
- 需要释放端口
- 暂时不使用系统

### docker-status.bat - 查看状态

**功能**:
- 显示所有运行中的容器
- 显示端口映射
- 显示资源使用情况

**输出示例**:
```
📊 运行中的容器:
NAMES                   STATUS          PORTS
coffee-shop-backend     Up 5 minutes    0.0.0.0:3000->3000/tcp
coffee-shop-frontend    Up 5 minutes    0.0.0.0:80->80/tcp

💾 Docker资源使用:
NAME                    CPU %    MEM USAGE
coffee-shop-backend     0.50%    45MiB / 2GiB
coffee-shop-frontend    0.10%    23MiB / 2GiB
```

### docker-logs.bat - 查看日志

**功能**:
- 交互式选择要查看的服务
- 实时显示日志（自动滚动）

**使用方法**:
1. 运行脚本
2. 选择服务（1-后端，2-前端，3-全部）
3. 查看实时日志
4. 按 `Ctrl+C` 退出

## 🔧 常见使用场景

### 场景1: 每天开始工作

```
1. 双击 docker-start.bat
2. 等待启动完成
3. 浏览器自动打开，开始使用
```

### 场景2: 检查系统状态

```
1. 双击 docker-status.bat
2. 查看容器是否正常运行
3. 检查端口是否正确
```

### 场景3: 查看错误日志

```
1. 双击 docker-logs.bat
2. 选择 1（后端）或 2（前端）
3. 查找错误信息
4. 按 Ctrl+C 退出
```

### 场景4: 重新构建（更新代码后）

```
1. 双击 docker-manager.bat
2. 输入 8（重新构建并启动）
3. 等待构建完成
```

### 场景5: 下班关闭

```
双击 docker-stop.bat
```

## ⚠️ 重要提示

### 1. 首次运行
- 确保Docker Desktop已安装并启动
- 首次运行会下载依赖，需要5-10分钟
- 后续启动只需几秒钟

### 2. 端口占用
如果提示端口被占用：
- 检查是否有其他程序使用80或3000端口
- 修改 `docker-compose.yml` 中的端口映射
- 或停止占用端口的程序

### 3. 数据持久化
- 使用 `docker-stop.bat` 停止服务不会删除数据
- 数据保存在Docker容器的数据卷中
- 只有使用 `docker-manager.bat` 的选项9才会清除数据

### 4. 权限问题
- 以管理员身份运行脚本
- 确保Docker Desktop有足够权限

## 🆘 故障排查

### 问题1: "Docker未运行"
**解决**:
1. 启动Docker Desktop
2. 等待图标变绿
3. 重新运行脚本

### 问题2: 启动失败
**解决**:
1. 运行 `docker-logs.bat`
2. 查看错误信息
3. 检查端口是否被占用

### 问题3: 无法访问网页
**解决**:
1. 运行 `docker-status.bat` 确认容器运行
2. 访问 http://localhost:3000/health 检查后端
3. 检查防火墙设置

### 问题4: 需要重新构建
**解决**:
1. 运行 `docker-manager.bat`
2. 选择选项 8（重新构建）

## 💡 高级技巧

### 1. 开机自动启动
将 `docker-start.bat` 的快捷方式放到启动文件夹：
```
Win+R → shell:startup
```

### 2. 桌面快捷方式
右键脚本 → 发送到 → 桌面快捷方式

### 3. 命令行使用
```bash
# 进入项目目录
cd D:\2026_backend_yjl\coffee-shop-scheduling

# 直接运行脚本
docker-start.bat
docker-stop.bat
docker-status.bat
```

## 📚 相关文档

- **完整使用指南**: `README.md`
- **Docker安装**: `WINDOWS_SETUP.md`
- **测试指南**: `TESTING.md`
- **快速开始**: `GETTING_STARTED.md`

## 🎉 总结

**最推荐的使用方式**:
1. 日常使用：双击 `docker-start.bat`
2. 管理和调试：双击 `docker-manager.bat`
3. 快速查看：双击 `docker-status.bat`

**一个典型的工作流程**:
```
早上: docker-start.bat → 自动打开系统
使用: 正常打卡、排班操作
遇到问题: docker-logs.bat → 查看错误
下班: docker-stop.bat → 关闭服务
```

祝您使用愉快！☕🎉
