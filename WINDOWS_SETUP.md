# ⚠️ Windows环境安装说明

## 问题说明

`better-sqlite3` 是一个需要编译的原生模块，在Windows上需要安装Visual Studio构建工具。

## 解决方案

### 方案1: 安装Windows构建工具（推荐用于生产环境）

1. **安装Visual Studio构建工具**:
```bash
npm install --global windows-build-tools
```

或者下载安装：
https://visualstudio.microsoft.com/downloads/
选择"Desktop development with C++"工作负载

2. **重新安装依赖**:
```bash
cd backend
npm install
```

### 方案2: 使用Docker（最简单）

不需要安装任何构建工具，直接使用Docker：

```bash
# 进入项目目录
cd D:\2026_backend_yjl\coffee-shop-scheduling

# 启动服务
docker-compose up --build
```

访问: http://localhost

### 方案3: 使用预编译的better-sqlite3

某些Node.js版本有预编译的二进制文件：

```bash
cd backend
npm install better-sqlite3 --build-from-source=false
```

### 方案4: 切换到sql.js（纯JavaScript实现）

我已经在package.json中准备了sql.js替代方案，但需要修改db.ts文件。

如果选择此方案，需要：
1. 修改 `src/db.ts` 使用sql.js API
2. 重新安装依赖

## 快速测试（不安装）

如果只是想快速查看代码和了解项目结构，可以：

1. **查看代码**：所有源代码都在 `backend/src/` 和 `frontend/src/`
2. **查看文档**：
   - `README.md` - 完整文档
   - `PROJECT_SUMMARY.md` - 项目总结
   - `TESTING.md` - 测试指南
3. **查看数据库设计**：`backend/database/schema.sql`

## 推荐做法

### 对于开发/测试
**使用Docker** - 最简单，无需配置环境

### 对于生产部署
**安装构建工具** - better-sqlite3性能更好

## Docker安装指南

如果您还没有Docker：

1. 下载Docker Desktop for Windows:
   https://www.docker.com/products/docker-desktop

2. 安装并启动Docker Desktop

3. 运行项目:
```bash
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker-compose up --build
```

第一次构建需要5-10分钟，之后启动只需几秒钟。

## 验证安装

### 检查Node.js版本
```bash
node -v
# 应该显示 v18 或更高
```

### 检查Docker
```bash
docker --version
docker-compose --version
```

## 当前项目状态

✅ **代码完整**: 所有功能已实现
✅ **文档完整**: README、测试指南、API文档
✅ **Docker配置**: 可直接使用
⚠️ **本地运行**: 需要安装构建工具

## 替代方案总结

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| Docker | 无需配置环境，开箱即用 | 需要安装Docker | ⭐⭐⭐⭐⭐ |
| 安装构建工具 | 性能最好，直接运行 | 需要安装VS工具 | ⭐⭐⭐⭐ |
| sql.js | 纯JS，无需编译 | 性能较低，需改代码 | ⭐⭐⭐ |

## 帮助

如果遇到其他问题：
1. 检查Node.js版本是否>=18
2. 以管理员身份运行命令提示符
3. 清除npm缓存: `npm cache clean --force`
4. 删除node_modules后重新安装

---

**建议**: 使用Docker是最快速的方式，无需配置复杂的编译环境。
