# Docker 镜像加速器配置指南

## 问题现象
下载 Docker 镜像时出现超时或连接错误：
- `dial tcp xxx:443: connectex: A connection attempt failed`
- `failed to do request: Head "https://...": EOF`

## 解决方案

### 方案1：配置阿里云镜像加速器（推荐，最稳定）

#### 1. 获取专属加速地址
1. 访问：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors
2. 登录阿里云账号（没有的话快速注册一个，免费）
3. 获取您的专属加速器地址，类似：`https://xxxxx.mirror.aliyuncs.com`

#### 2. 配置 Docker Desktop
1. 右键点击任务栏的 Docker 图标
2. 选择 **Settings**
3. 选择左侧 **Docker Engine**
4. 在 JSON 配置中添加：

```json
{
  "registry-mirrors": [
    "https://xxxxx.mirror.aliyuncs.com"
  ]
}
```

5. 点击 **Apply & restart**

---

### 方案2：尝试其他公共镜像源

如果不想注册阿里云，可以尝试以下配置（稳定性可能较低）：

```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "http://hub-mirror.c.163.com"
  ]
}
```

**注意**：不要同时配置太多镜像源，选1-2个即可。

---

### 方案3：临时取消镜像加速

如果您的网络直连 Docker Hub 较快，可以暂时移除镜像配置：

```json
{
  "registry-mirrors": []
}
```

或者完全删除 `"registry-mirrors"` 这一行。

---

### 方案4：手动下载镜像

如果配置镜像源后仍然失败，可以手动逐个下载：

```cmd
cd D:\2026_backend_yjl\coffee-shop-scheduling

# 下载 Node.js 镜像
docker pull node:18-alpine

# 下载 Nginx 镜像  
docker pull nginx:alpine

# 下载完成后再构建
docker compose up -d --build
```

---

## 验证配置

### 1. 检查配置是否生效
```cmd
docker info | findstr "Registry Mirrors"
```

应该显示您配置的镜像源地址。

### 2. 测试下载
```cmd
docker pull hello-world
```

如果成功，说明镜像加速器工作正常。

---

## 常见问题

### Q: 配置后还是很慢？
A: 
- 尝试更换其他镜像源
- 检查防火墙/杀毒软件是否拦截
- 尝试切换网络（WiFi/有线/手机热点）

### Q: 显示 EOF 错误？
A:
- 说明能连接但传输中断
- 尝试移除所有镜像源，直连 Docker Hub
- 或更换更稳定的镜像源（推荐阿里云）

### Q: 完全无法连接？
A:
- 检查 Docker Desktop 是否正在运行
- 检查网络防火墙设置
- 尝试重启 Docker Desktop
- 尝试使用手机热点测试

---

## 推荐配置（按优先级）

### 🥇 首选：阿里云
```json
{
  "registry-mirrors": ["https://你的ID.mirror.aliyuncs.com"]
}
```
- 需要注册但最稳定
- 有专属加速地址

### 🥈 备选：腾讯云
```json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}
```
- 无需注册
- 速度较快

### 🥉 其他：网易
```json
{
  "registry-mirrors": ["http://hub-mirror.c.163.com"]
}
```
- 无需注册
- 稳定性一般

---

## 下一步

配置完成后：

1. **重启 Docker Desktop**
2. **验证配置**：`docker info | findstr "Registry"`
3. **重新启动容器**：
   ```cmd
   cd D:\2026_backend_yjl\coffee-shop-scheduling
   docker compose up -d --build
   ```

---

**如果仍有问题，请提供错误截图！**
