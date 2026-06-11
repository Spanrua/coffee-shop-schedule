@echo off
chcp 65001 >nul
echo ================================
echo 咖啡店排班打卡系统 - 快速启动脚本
echo ================================
echo.

REM 检查Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 错误: 未安装Node.js
    echo 请先安装Node.js 18或更高版本
    pause
    exit /b 1
)

node -v
echo.

REM 后端初始化
echo 📦 初始化后端...
cd backend
if not exist node_modules (
    echo 安装后端依赖...
    call npm install
)

REM 创建.env文件
if not exist .env (
    copy .env.example .env
    echo ✓ 创建后端.env配置文件
)

REM 启动后端
echo 🚀 启动后端服务...
start "咖啡店系统-后端" cmd /k npm run dev
cd ..

REM 等待后端启动
echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

REM 前端初始化
echo.
echo 📦 初始化前端...
cd frontend
if not exist node_modules (
    echo 安装前端依赖...
    call npm install
)

REM 创建.env文件
if not exist .env (
    copy .env.example .env
    echo ✓ 创建前端.env配置文件
)

REM 启动前端
echo 🚀 启动前端服务...
start "咖啡店系统-前端" cmd /k npm run dev
cd ..

echo.
echo ================================
echo ✅ 系统启动成功！
echo ================================
echo.
echo 🌐 访问地址:
echo    前端: http://localhost:5173
echo    后端: http://localhost:3000
echo.
echo 👤 默认账号:
echo    管理员: admin / admin123
echo    员工: employee1 / employee123
echo.
echo 关闭终端窗口即可停止服务
echo.
pause
