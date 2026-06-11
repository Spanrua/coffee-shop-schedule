# Docker MCP Server 配置指南

## 什么是MCP？

MCP (Model Context Protocol) 允许Claude通过服务器插件与外部系统交互。我们可以创建一个Docker MCP服务器，让Claude直接控制Docker容器。

## 方案A: 使用现有的Docker MCP（如果存在）

检查Claude Code设置中是否有Docker相关的MCP服务器。

## 方案B: 创建自定义Docker MCP服务器

### 1. 创建MCP服务器

在项目根目录创建 `docker-mcp-server/` 文件夹：

```typescript
// docker-mcp-server/index.ts
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// MCP服务器工具定义
export const tools = [
  {
    name: 'docker-compose-up',
    description: '启动Docker Compose服务',
    inputSchema: {
      type: 'object',
      properties: {
        detached: { type: 'boolean', description: '是否后台运行' },
        build: { type: 'boolean', description: '是否重新构建' }
      }
    }
  },
  {
    name: 'docker-compose-down',
    description: '停止Docker Compose服务',
    inputSchema: {
      type: 'object',
      properties: {
        volumes: { type: 'boolean', description: '是否删除数据卷' }
      }
    }
  },
  {
    name: 'docker-ps',
    description: '列出运行中的容器',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'docker-logs',
    description: '查看容器日志',
    inputSchema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: '服务名称' },
        tail: { type: 'number', description: '显示最后N行' }
      },
      required: ['service']
    }
  }
];

// 工具处理函数
export async function handleToolCall(name: string, args: any) {
  const projectPath = 'D:\\2026_backend_yjl\\coffee-shop-scheduling';
  
  switch (name) {
    case 'docker-compose-up': {
      let cmd = 'docker-compose up';
      if (args.build) cmd += ' --build';
      if (args.detached) cmd += ' -d';
      
      const { stdout, stderr } = await exec(cmd, { cwd: projectPath });
      return { success: true, output: stdout, error: stderr };
    }
    
    case 'docker-compose-down': {
      let cmd = 'docker-compose down';
      if (args.volumes) cmd += ' -v';
      
      const { stdout, stderr } = await exec(cmd, { cwd: projectPath });
      return { success: true, output: stdout, error: stderr };
    }
    
    case 'docker-ps': {
      const { stdout } = await exec('docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
      return { containers: stdout };
    }
    
    case 'docker-logs': {
      let cmd = `docker-compose logs ${args.service}`;
      if (args.tail) cmd += ` --tail=${args.tail}`;
      
      const { stdout } = await exec(cmd, { cwd: projectPath });
      return { logs: stdout };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

### 2. 配置Claude Code

在Claude Code设置中添加MCP服务器配置：

**Windows路径**: `%USERPROFILE%\.claude\config.json`

```json
{
  "mcpServers": {
    "docker": {
      "command": "node",
      "args": ["D:\\2026_backend_yjl\\coffee-shop-scheduling\\docker-mcp-server\\index.js"],
      "env": {
        "PROJECT_PATH": "D:\\2026_backend_yjl\\coffee-shop-scheduling"
      }
    }
  }
}
```

### 3. 使用方法

配置完成后，您可以直接对Claude说：

- "启动咖啡店系统的Docker服务"
- "查看Docker容器状态"
- "停止所有Docker容器"
- "查看后端服务日志"

Claude会自动调用MCP工具执行Docker命令。

## 方案C: 简单的命令别名（最快）

在不创建完整MCP的情况下，可以使用简单的批处理脚本：

### 创建快捷命令

**docker-start.bat**:
```batch
@echo off
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker-compose up -d --build
echo Docker服务已启动！
echo 访问: http://localhost
pause
```

**docker-stop.bat**:
```batch
@echo off
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker-compose down
echo Docker服务已停止！
pause
```

**docker-logs.bat**:
```batch
@echo off
cd D:\2026_backend_yjl\coffee-shop-scheduling
docker-compose logs -f
```

**docker-status.bat**:
```batch
@echo off
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
pause
```

将这些文件放在项目根目录，双击即可运行。

## 方案D: Docker Desktop GUI（最直观）

Docker Desktop自带可视化界面：

1. **启动Docker Desktop**
2. **查看Containers/Apps**
   - 可以看到所有容器
   - 点击容器查看日志
   - 点击按钮启动/停止
3. **查看Images**
   - 管理镜像
4. **查看Volumes**
   - 查看数据卷

## 推荐的集成方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| VS Code Docker扩展 | 功能强大，集成好 | 需要VS Code | ⭐⭐⭐⭐⭐ |
| Docker Desktop GUI | 官方工具，直观 | 不够自动化 | ⭐⭐⭐⭐ |
| 批处理脚本 | 最简单快速 | 功能有限 | ⭐⭐⭐⭐ |
| 自定义MCP | Claude直接控制 | 需要开发 | ⭐⭐⭐ |

## 立即可用的方案

### 最简单：使用Docker Desktop

1. 打开Docker Desktop
2. 在终端运行：
   ```bash
   cd D:\2026_backend_yjl\coffee-shop-scheduling
   docker-compose up -d --build
   ```
3. 在Docker Desktop中查看和管理

### 最智能：VS Code + Docker扩展

1. 安装VS Code Docker扩展
2. 打开项目文件夹
3. 右键 `docker-compose.yml` → Compose Up
4. 在Docker侧边栏管理所有容器

### 最快捷：使用批处理脚本

我可以为您创建这些脚本文件！

## 下一步行动

您希望我：
1. ✅ 创建批处理快捷脚本（最快，立即可用）
2. 🔧 创建完整的Docker MCP服务器（需要配置）
3. 📖 提供VS Code Docker扩展使用教程

选择任意方案，我都可以帮您实现！
