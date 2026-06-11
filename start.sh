#!/bin/bash

echo "================================"
echo "☕ 咖啡店排班打卡系统"
echo "================================"
echo ""

echo "🛑 停止并清理旧容器..."
docker compose down

echo ""
echo "🔨 重新构建并启动服务..."
docker compose up -d --build

echo ""
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "================================"
echo "✅ 系统启动成功！"
echo "================================"
echo ""
echo "🌐 访问地址:"
echo "   前端: http://localhost"
echo "   后端: http://localhost:3000"
echo ""
echo "👤 默认账号:"
echo "   管理员: admin / admin123"
echo "   员工:   emp001 / password123"
echo ""
echo "📋 查看日志:"
echo "   docker compose logs -f"
echo ""
echo "🛑 停止服务:"
echo "   docker compose down"
echo ""
