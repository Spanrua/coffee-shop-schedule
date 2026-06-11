@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Login Test
echo ========================================
echo.

echo [1] Testing backend API login:
curl -v -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.
echo.

echo [2] Backend logs:
docker logs coffee-shop-backend --tail 20
echo.

echo [3] Frontend logs:
docker logs coffee-shop-frontend --tail 10
echo.

pause
