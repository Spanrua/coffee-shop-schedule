@echo off
echo.
echo ========================================
echo    Coffee Shop System - Docker Start
echo ========================================
echo.

REM Check if Docker is running
docker ps >/dev/null 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo 2. Start Docker Desktop
    echo 3. Wait for the Docker icon to turn green
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is ready
echo.

cd /d "%~dp0"

echo [INFO] Starting services (background mode)...
echo.

REM Try docker compose (new version) first
docker compose version >/dev/null 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose up -d --build
) else (
    REM Fall back to docker-compose (old version)
    docker-compose up -d --build
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo          Success!
    echo ========================================
    echo.
    echo [WEB] Frontend: http://localhost
    echo [API] Backend:  http://localhost:3000
    echo.
    echo [LOGIN] Test accounts:
    echo    Admin:    admin / admin123
    echo    Employee: employee1 / employee123
    echo.
    echo [TIP] Use docker-status.bat to check status
    echo [TIP] Use docker-logs.bat to view logs
    echo [TIP] Use docker-stop.bat to stop services
    echo.

    REM Wait 3 seconds then open browser
    timeout /t 3 /nobreak >/dev/null
    start http://localhost
) else (
    echo.
    echo [ERROR] Failed to start!
    echo.
    echo Please check:
    echo 1. Docker Desktop is running
    echo 2. Ports 80 and 3000 are not in use
    echo 3. Check error messages above
    echo.
    echo If docker-compose is not found, install Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    echo.
)

pause
