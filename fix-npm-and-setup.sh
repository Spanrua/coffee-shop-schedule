#!/bin/bash
# 修复 npm 问题并完成配置

set -e

echo "=========================================="
echo "检查并修复 npm"
echo "=========================================="
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    echo "✓ Node.js: $(node -v)"
else
    echo "❌ Node.js 未安装"
    exit 1
fi
echo ""

# 尝试不同方式检查 npm
echo ">>> 检查 npm..."

# 方法 1: 直接运行 npm
if /usr/bin/npm --version &> /dev/null; then
    NPM_VERSION=$(/usr/bin/npm --version)
    echo "✓ npm 已安装: v$NPM_VERSION"
    NPM_CMD="/usr/bin/npm"
elif command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm 已安装: v$NPM_VERSION"
    NPM_CMD="npm"
else
    echo "⚠️  npm 未找到，尝试重新安装..."

    # 重新安装 npm
    apt-get install -y npm

    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo "✓ npm 安装成功: v$NPM_VERSION"
        NPM_CMD="npm"
    else
        echo "❌ npm 安装失败，请手动安装"
        exit 1
    fi
fi
echo ""

# 配置 npm 镜像
echo ">>> 配置 npm 淘宝镜像..."
$NPM_CMD config set registry https://registry.npmmirror.com
CURRENT_REGISTRY=$($NPM_CMD config get registry)
echo "✓ npm 镜像已设置为: $CURRENT_REGISTRY"
echo ""

# 配置 Docker 镜像源
echo "=========================================="
echo "配置 Docker 镜像源"
echo "=========================================="
echo ""

if command -v docker &> /dev/null; then
    echo "✓ Docker 已安装"

    # 备份原配置
    if [ -f /etc/docker/daemon.json ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%Y%m%d_%H%M%S)
        echo "✓ 已备份原配置"
    fi

    # 创建新配置
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

    echo "✓ Docker 镜像源配置已更新"

    # 重启 Docker
    echo ">>> 重启 Docker 服务..."
    systemctl daemon-reload
    systemctl restart docker
    sleep 2
    echo "✓ Docker 服务已重启"
else
    echo "⚠️  Docker 未安装"
fi
echo ""

# 显示最终状态
echo "=========================================="
echo "✅ 配置完成！"
echo "=========================================="
echo ""
echo "环境信息："
echo "  Node.js: $(node -v)"
echo "  npm: $($NPM_CMD -v)"
echo "  npm 镜像: $($NPM_CMD config get registry)"
command -v docker &> /dev/null && echo "  Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
echo ""

echo "=========================================="
echo "下一步操作："
echo "=========================================="
echo ""
echo "1. 进入项目目录并安装依赖："
echo "   cd ~/coffee-shop-scheduling/backend"
echo "   npm install"
echo ""
echo "2. 返回项目根目录并配置环境："
echo "   cd ~/coffee-shop-scheduling"
echo "   cp .env.tencent.example .env"
echo "   openssl rand -hex 32    # 生成密钥"
echo "   # 编辑 .env 文件，设置 JWT_SECRET=<上面生成的密钥>"
echo ""
echo "3. 启动服务："
echo "   docker compose -f docker-compose.tencent.yml --env-file .env up -d --build"
echo ""
echo "4. 检查服务状态："
echo "   docker compose -f docker-compose.tencent.yml ps"
echo "   docker compose -f docker-compose.tencent.yml logs -f backend"
echo ""
echo "5. 测试 API："
echo "   curl http://localhost:3000/health"
echo ""
