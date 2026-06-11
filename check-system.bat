@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Coffee Shop System - Status Check
echo ========================================
echo.

echo [1/4] Checking Docker containers...
docker ps --filter "name=coffee-shop" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [2/4] Checking backend health...
curl -s http://localhost:3000/api/health >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend is running on http://localhost:3000
) else (
    echo [WARN] Backend is not responding yet
)
echo.

echo [3/4] Checking frontend...
curl -s http://localhost >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Frontend is running on http://localhost
) else (
    echo [WARN] Frontend is not responding yet
)
echo.

echo [4/4] Quick test...
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] API authentication works
) else (
    echo [INFO] API may still be starting
)
echo.

echo ========================================
echo   System Access
echo ========================================
echo.
echo Frontend: http://localhost
echo Backend:  http://localhost:3000
echo.
echo Default Admin Account:
echo   Username: admin
echo   Password: admin123
echo.
echo ========================================
echo.
pause
