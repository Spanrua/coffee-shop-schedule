@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Container Logs Check
echo ========================================
echo.

echo [1] Frontend logs:
echo ----------------------------------------
docker logs coffee-shop-frontend --tail 20
echo.

echo [2] Backend logs:
echo ----------------------------------------
docker logs coffee-shop-backend --tail 20
echo.

echo [3] Container status:
echo ----------------------------------------
docker ps --filter "name=coffee-shop"
echo.

echo [4] Testing backend API:
echo ----------------------------------------
curl -s http://localhost:3000/api/health
echo.
echo.

echo [5] Testing frontend:
echo ----------------------------------------
curl -I http://localhost
echo.

pause
