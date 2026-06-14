#!/bin/bash
# 国内服务器完整环境配置脚本
# 包含 Node.js、npm、Docker 镜像源配置

set -e

echo "=========================================="
echo "Coffee Shop Scheduling - 环境配置"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  请使用 root 权限运行此脚本"
    echo "使用: sudo ./setup-china-environment.sh"
    exit 1
fi

# 1. 更新系统包索引
echo ">>> 更新系统包索引..."
apt-get update -qq
echo "✓ 系统包索引已更新"
echo ""

# 2. 检查并安装 Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✓ Node.js 已安装: $NODE_VERSION"
else
    echo ">>> 安装 Node.js 20.x (使用清华大学镜像)..."

    # 使用清华大学镜像源安装 Node.js
    curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/deb_20.x/nodistro/repo/setup | bash -
    apt-get install -y nodejs

    NODE_VERSION=$(node -v)
    echo "✓ Node.js 已安装: $NODE_VERSION"
fi
echo ""

# 3. 验证 npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✓ npm 已安装: $NPM_VERSION"
else
    echo "❌ npm 安装失败"
    exit 1
fi
echo ""

# 4. 配置 npm 淘宝镜像
echo ">>> 配置 npm 淘宝镜像..."
npm config set registry https://registry.npmmirror.com
CURRENT_REGISTRY=$(npm config get registry)
echo "✓ npm 镜像已设置为: $CURRENT_REGISTRY"
echo ""

# 5. 配置 Docker 镜像源
echo "=========================================="
echo "配置 Docker 镜像源"
echo "=========================================="
echo ""

if command -v docker &> /dev/null; then
    echo "✓ Docker 已安装"

    # 备份原配置（如果存在）
    if [ -f /etc/docker/daemon.json ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
        echo "✓ 已备份原配置到 /etc/docker/daemon.json.backup"
    fi

    # 创建新配置
    mkdir -p /etc/docker
    tee /etc/docker/daemon.json > /dev/null <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

    echo "✓ Docker 镜像源配置已写入 /etc/docker/daemon.json"

    # 重启 Docker
    echo ">>> 重启 Docker 服务..."
    systemctl daemon-reload
    systemctl restart docker
    echo "✓ Docker 服务已重启"
    echo ""

    # 验证配置
    echo ">>> 验证 Docker 镜像源配置..."
    docker info | grep -A 5 "Registry Mirrors" || echo "配置已生效（可能不显示在 docker info 中）"
else
    echo "⚠️  Docker 未安装，跳过 Docker 镜像源配置"
    echo ""
    echo "如需安装 Docker，请运行："
    echo "  curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun"
fi
echo ""

# 6. 安装 Docker Compose（如果需要）
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker 未安装，跳过 Docker Compose 检查"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo "✓ Docker Compose 已安装: $COMPOSE_VERSION"
else
    echo "⚠️  Docker Compose 未安装"
    echo "Docker Compose 通常随 Docker 一起安装"
fi
echo ""

# 7. 显示最终状态
echo "=========================================="
echo "✅ 环境配置完成！"
echo "=========================================="
echo ""
echo "已安装/配置："
command -v node &> /dev/null && echo "  ✓ Node.js $(node -v)"
command -v npm &> /dev/null && echo "  ✓ npm $(npm -v) - 镜像: $(npm config get registry)"
command -v docker &> /dev/null && echo "  ✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
docker compose version &> /dev/null && echo "  ✓ Docker Compose $(docker compose version --short)"
echo ""

echo "=========================================="
echo "下一步操作："
echo "=========================================="
echo ""
echo "1. 进入项目目录："
echo "   cd ~/coffee-shop-scheduling"
echo ""
echo "2. 安装后端依赖："
echo "   cd backend && npm install && cd .."
echo ""
echo "3. 配置环境变量："
echo "   cp .env.tencent.example .env"
echo "   # 编辑 .env 文件，设置 JWT_SECRET"
echo ""
echo "4. 启动服务："
echo "   docker compose -f docker-compose.tencent.yml --env-file .env up -d --build"
echo ""
echo "5. 检查状态："
echo "   docker compose -f docker-compose.tencent.yml ps"
echo "   curl http://localhost:3000/health"
echo ""
