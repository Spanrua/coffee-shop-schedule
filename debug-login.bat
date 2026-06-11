@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Debug Login Issue
echo ========================================
echo.

echo [1] Testing backend health:
curl -s http://localhost:3000/api/health
echo.
echo.

echo [2] Backend logs (last 30 lines):
docker logs coffee-shop-backend --tail 30
echo.

echo [3] Testing login API directly:
echo Testing admin login...
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.
echo.

echo [4] Container status:
docker ps --filter "name=coffee-shop"
echo.

echo [5] Check if database file exists in container:
docker exec coffee-shop-backend ls -la /app/database/
echo.

pause
