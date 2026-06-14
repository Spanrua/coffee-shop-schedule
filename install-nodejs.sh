#!/bin/bash
# 快速安装 Node.js 20.x（国内优化）

set -e

echo "=========================================="
echo "安装 Node.js 20.x (使用国内镜像)"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  请使用 root 权限运行此脚本"
    echo "使用: sudo ./install-nodejs.sh"
    exit 1
fi

# 检查是否已安装
if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node -v)
    echo "Node.js 已安装: $CURRENT_VERSION"
    read -p "是否要重新安装？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "取消安装"
        exit 0
    fi
fi

echo ">>> 更新系统包索引..."
apt-get update -qq

echo ""
echo ">>> 下载 Node.js 20.x 安装脚本（清华大学镜像）..."
curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/deb_20.x/nodistro/repo/setup | bash -

echo ""
echo ">>> 安装 Node.js..."
apt-get install -y nodejs

echo ""
echo "=========================================="
echo "✅ 安装完成！"
echo "=========================================="
node -v
npm -v
echo ""
echo "下一步："
echo "  npm config set registry https://registry.npmmirror.com"
echo ""
