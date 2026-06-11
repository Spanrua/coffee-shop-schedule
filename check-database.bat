@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Check Database Users
echo ========================================
echo.

echo [1] Checking users in database:
docker exec coffee-shop-backend node -e "const Database = require('better-sqlite3'); const db = new Database('/app/database/coffee-shop.db'); const users = db.prepare('SELECT id, username, name, role FROM users').all(); console.log(JSON.stringify(users, null, 2));"
echo.

echo [2] Checking if database file exists:
docker exec coffee-shop-backend ls -la /app/database/
echo.

echo [3] Backend logs:
docker logs coffee-shop-backend --tail 30
echo.

pause
