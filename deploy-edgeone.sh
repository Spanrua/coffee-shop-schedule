#!/bin/bash

# 咖啡店排班系统 - EdgeOne Pages 部署脚本

echo "🚀 开始部署到 EdgeOne Pages..."

# 1. 检查环境
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 未安装 npm"
    exit 1
fi

# 2. 进入前端目录
cd frontend || exit 1

# 3. 安装依赖
echo "📦 安装依赖..."
npm install

# 4. 构建项目
echo "🔨 构建项目..."
npm run build

# 5. 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建产物位于: frontend/dist"
    echo ""
    echo "📝 下一步："
    echo "1. 访问 EdgeOne Pages 控制台: https://console.cloud.tencent.com/edgeone/pages"
    echo "2. 创建新项目"
    echo "3. 选择部署方式："
    echo "   - Git 仓库自动部署（推荐）"
    echo "   - 手动上传 dist 文件夹"
    echo ""
    echo "🔧 记得配置环境变量："
    echo "   VITE_API_URL=https://your-backend-domain.com/api"
    echo ""
    echo "🎉 部署完成后，记得更新后端 CORS 配置！"
else
    echo "❌ 构建失败！"
    exit 1
fi
