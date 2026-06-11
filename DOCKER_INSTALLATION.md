# 🐳 Docker安装和配置完整指南

## ⚠️ 重要提示

如果您看到 "docker-compose is not recognized" 错误，说明Docker Desktop未安装或未正确配置。

---

## 📥 安装Docker Desktop

### 步骤1: 下载Docker Desktop

**官方下载地址**:
https://www.docker.com/products/docker-desktop

**选择对应版本**:
- Windows 10/11 (64位)
- 需要WSL 2支持

### 步骤2: 系统要求检查

**Windows系统要求**:
- Windows 10 64位: Pro、Enterprise或Education版本（Build 19041或更高）
- Windows 11 64位: Home、Pro、Enterprise或Education版本
- 至少4GB RAM
- 启用BIOS虚拟化

**检查Windows版本**:
```
Win + R → 输入 winver → 回车
```

### 步骤3: 启用WSL 2

**1. 启用Windows功能**

以管理员身份打开PowerShell，运行：

```powershell
# 启用虚拟机平台
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 启用WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

**2. 重启电脑**

**3. 安装WSL 2 Linux内核更新包**

下载并安装:
https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi

**4. 设置WSL 2为默认版本**

```powershell
wsl --set-default-version 2
```

### 步骤4: 安装Docker Desktop

1. **运行下载的安装程序** (Docker Desktop Installer.exe)
2. **配置选项**:
   - ✅ Use WSL 2 instead of Hyper-V (推荐)
   - ✅ Add shortcut to desktop
3. **点击 "OK"** 开始安装
4. **安装完成后** 点击 "Close and restart"
5. **重启电脑**

### 步骤5: 首次启动Docker Desktop

1. **启动Docker Desktop**
   - 在开始菜单找到 "Docker Desktop"
   - 双击启动

2. **接受服务协议**

3. **等待Docker启动**
   - 右下角托盘会显示Docker图标
   - 初始启动需要1-2分钟
   - 图标变成绿色表示就绪

4. **验证安装**

打开命令提示符或PowerShell，运行：

```bash
docker --version
docker compose version
```

应该看到类似输出：
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.3
```

---

## 🔧 Docker配置

### 配置1: 资源分配（可选）

1. **打开Docker Desktop**
2. **点击右上角设置图标（齿轮）**
3. **进入 Resources**
4. **调整资源**:
   - CPUs: 2-4个（推荐4个）
   - Memory: 4-8 GB（推荐6GB）
   - Swap: 1-2 GB
   - Disk image size: 至少20GB

### 配置2: 镜像加速（中国用户推荐）

1. **打开Docker Desktop设置**
2. **进入 Docker Engine**
3. **添加镜像源**:

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

4. **点击 "Apply & Restart"**

---

## ✅ 验证Docker安装

### 测试1: 检查Docker命令

```bash
# 查看Docker版本
docker --version

# 查看Docker Compose版本
docker compose version

# 或旧版本命令
docker-compose --version

# 查看Docker信息
docker info

# 测试Docker是否正常运行
docker run hello-world
```

### 测试2: 运行测试容器

```bash
docker run -d -p 8080:80 nginx
```

然后访问 http://localhost:8080，应该看到Nginx欢迎页面。

停止测试容器：
```bash
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
```

---

## 🎯 运行咖啡店系统

安装完成后，返回项目目录：

### 方法1: 使用快捷脚本
```
双击 docker-start.bat
```

### 方法2: 使用命令行
```bash
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker compose up -d --build
```

---

## 🆘 常见问题和解决方案

### 问题1: "WSL 2 installation is incomplete"

**解决**:
1. 安装WSL 2 Linux内核更新包（见上面步骤3）
2. 重启Docker Desktop

### 问题2: "Hardware assisted virtualization and data execution protection must be enabled"

**解决**:
1. 重启电脑进入BIOS
2. 启用虚拟化（VT-x/AMD-V）
3. 保存并重启

**不同主板进入BIOS的方式**:
- Dell: F2
- HP: F10或Esc
- Lenovo: F1或F2
- ASUS: Del或F2

### 问题3: "Docker Desktop requires Windows 10 Pro/Enterprise"

**解决**:
- 如果是Windows 10 Home，需要先升级到Pro版本
- 或者使用Docker Toolbox（已弃用）
- 建议升级到Windows 11 Home（支持Docker Desktop）

### 问题4: "docker-compose" 命令不存在

**原因**: 使用的是Docker Desktop新版本，命令已改为 `docker compose`（没有连字符）

**解决**: 
- 已在脚本中自动处理
- 或手动使用 `docker compose` 代替 `docker-compose`

### 问题5: Docker Desktop启动很慢

**解决**:
1. 确保WSL 2正确安装
2. 检查防病毒软件是否阻止
3. 增加Docker资源分配
4. 重启Docker Desktop

### 问题6: 端口被占用

**错误**: "port is already allocated"

**解决**:
1. 查看哪个程序占用了端口:
```bash
netstat -ano | findstr :80
netstat -ano | findstr :3000
```

2. 停止占用端口的程序
3. 或修改 `docker-compose.yml` 中的端口映射

### 问题7: Docker Desktop无法启动

**解决步骤**:
1. 完全卸载Docker Desktop
2. 删除 `C:\Users\你的用户名\.docker` 文件夹
3. 重新安装Docker Desktop
4. 重启电脑

---

## 🔍 检查清单

使用前请确认：

- [ ] Windows版本符合要求
- [ ] WSL 2已安装并设置为默认
- [ ] Docker Desktop已安装
- [ ] Docker Desktop正在运行（绿色图标）
- [ ] `docker --version` 命令有输出
- [ ] `docker compose version` 命令有输出
- [ ] 防火墙允许Docker
- [ ] 端口80和3000未被占用

---

## 📚 更多资源

**官方文档**:
- Docker Desktop安装: https://docs.docker.com/desktop/install/windows-install/
- WSL 2后端: https://docs.docker.com/desktop/windows/wsl/
- Docker Compose: https://docs.docker.com/compose/

**视频教程**:
- 搜索 "Docker Desktop Windows 安装教程"
- 搜索 "WSL 2 安装教程"

---

## ✅ 安装验证清单

完成安装后，运行以下命令验证：

```bash
# 1. 检查Docker
docker --version

# 2. 检查Docker Compose
docker compose version

# 3. 检查Docker运行状态
docker ps

# 4. 运行测试容器
docker run hello-world

# 5. 检查系统信息
docker info
```

所有命令都应该正常执行，没有错误。

---

## 🎉 完成！

Docker Desktop安装完成后，返回项目目录运行：

```
双击 docker-start.bat
```

系统会自动：
1. 检查Docker状态
2. 构建镜像
3. 启动容器
4. 打开浏览器

**首次启动需要5-10分钟下载依赖，请耐心等待！**

---

## 💡 小贴士

1. **开机自动启动**: Docker Desktop → Settings → General → "Start Docker Desktop when you log in"
2. **资源监控**: Docker Desktop → Dashboard → 查看容器资源使用
3. **清理空间**: 定期运行 `docker system prune -a` 清理未使用的镜像
4. **更新Docker**: Docker Desktop会自动提示更新

---

**需要帮助？** 查看 `QUICK_START_DOCKER.md` 或 `README.md`
