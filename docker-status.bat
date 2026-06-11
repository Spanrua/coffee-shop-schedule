@echo off
echo.
echo ========================================
echo   Coffee Shop System - Docker Status
echo ========================================
echo.

REM Check if Docker is running
docker ps >/dev/null 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo [INFO] Running containers:
echo ========================================
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [INFO] Project containers:
echo ========================================
cd /d "%~dp0"

REM Try docker compose (new version) first
docker compose version >/dev/null 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose ps
) else (
    docker-compose ps
)
echo.

echo [INFO] Resource usage:
echo ========================================
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo.

pause
