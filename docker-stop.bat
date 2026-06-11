@echo off
echo.
echo ========================================
echo    Coffee Shop System - Docker Stop
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Stopping all services...
echo.

REM Try docker compose (new version) first
docker compose version >/dev/null 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose down
) else (
    docker-compose down
)

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo       All services stopped
    echo ========================================
    echo.
) else (
    echo.
    echo [ERROR] Failed to stop! Please check Docker status
    echo.
)

pause
