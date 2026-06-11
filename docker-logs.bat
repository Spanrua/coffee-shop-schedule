@echo off
echo.
echo ========================================
echo   Coffee Shop System - Docker Logs
echo ========================================
echo.

cd /d "%~dp0"

echo Please select which service logs to view:
echo.
echo 1. Backend service
echo 2. Frontend service
echo 3. All services
echo 4. Exit
echo.

set /p choice=Enter option (1-4): 

REM Detect docker compose version
docker compose version >/dev/null 2>&1
if %ERRORLEVEL% equ 0 (
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

if "%choice%"=="1" (
    echo.
    echo [INFO] Backend logs (Press Ctrl+C to exit):
    echo ========================================
    %COMPOSE_CMD% logs -f backend
) else if "%choice%"=="2" (
    echo.
    echo [INFO] Frontend logs (Press Ctrl+C to exit):
    echo ========================================
    %COMPOSE_CMD% logs -f frontend
) else if "%choice%"=="3" (
    echo.
    echo [INFO] All services logs (Press Ctrl+C to exit):
    echo ========================================
    %COMPOSE_CMD% logs -f
) else (
    exit /b 0
)

pause
