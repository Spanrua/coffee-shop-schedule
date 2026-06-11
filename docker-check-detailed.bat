@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Docker Status - Detailed Check
echo ========================================
echo.

echo [1] Checking Docker Desktop status...
docker version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running or not installed
    echo Please make sure Docker Desktop is running
    pause
    exit /b 1
)
echo [OK] Docker Desktop is running
echo.

echo [2] Docker version:
docker --version
echo.

echo [3] Checking all containers:
docker ps -a
echo.

echo [4] Checking coffee-shop containers specifically:
docker ps -a --filter "name=coffee-shop"
echo.

echo [5] Checking images:
docker images | findstr coffee-shop
echo.

echo [6] If containers are running, checking logs:
docker logs coffee-shop-backend --tail 10 2>nul
echo.

echo [7] Network ports:
netstat -ano | findstr ":3000"
netstat -ano | findstr ":80"
echo.

echo ========================================
echo   Summary
echo ========================================
echo.
echo If you see containers above, check their STATUS column:
echo   - "Up X seconds/minutes" = Running successfully
echo   - "Exited (1)" = Failed to start
echo   - Nothing = Containers not created yet
echo.
pause
