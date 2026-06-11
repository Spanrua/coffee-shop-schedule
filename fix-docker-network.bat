@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   Docker Network Fix - Try Multiple Methods
echo ========================================
echo.

echo This script will help you download Docker images using different methods
echo.
echo Please choose a method:
echo.
echo [1] Try downloading directly (no mirror)
echo [2] Try Tencent Cloud mirror
echo [3] Try NetEase mirror
echo [4] Download images manually one by one
echo [5] Check network connectivity
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto direct
if "%choice%"=="2" goto tencent
if "%choice%"=="3" goto netease
if "%choice%"=="4" goto manual
if "%choice%"=="5" goto check
goto end

:direct
echo.
echo [INFO] Trying to pull images directly from Docker Hub...
echo.
docker pull node:18-alpine
if %ERRORLEVEL% equ 0 (
    echo [OK] node:18-alpine downloaded successfully
    docker pull nginx:alpine
    if %ERRORLEVEL% equ 0 (
        echo [OK] nginx:alpine downloaded successfully
        echo.
        echo [SUCCESS] All images downloaded! Now run: docker-start.bat
        goto end
    )
)
echo [FAILED] Direct download failed
goto end

:tencent
echo.
echo [INFO] Testing Tencent Cloud mirror...
curl -I https://mirror.ccs.tencentyun.com 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Tencent mirror is accessible
    echo Please update Docker Desktop settings:
    echo   Settings -^> Docker Engine -^> Add:
    echo   "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
) else (
    echo [WARN] Tencent mirror is not accessible from your network
)
goto end

:netease
echo.
echo [INFO] Testing NetEase mirror...
curl -I http://hub-mirror.c.163.com 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] NetEase mirror is accessible
    echo Please update Docker Desktop settings:
    echo   Settings -^> Docker Engine -^> Add:
    echo   "registry-mirrors": ["http://hub-mirror.c.163.com"]
) else (
    echo [WARN] NetEase mirror is not accessible from your network
)
goto end

:manual
echo.
echo [INFO] Downloading images one by one...
echo.
echo [1/2] Downloading node:18-alpine (this may take 2-5 minutes)...
docker pull node:18-alpine
if %ERRORLEVEL% equ 0 (
    echo [OK] node:18-alpine downloaded
) else (
    echo [ERROR] Failed to download node:18-alpine
    echo Try running this command manually: docker pull node:18-alpine
    goto end
)

echo.
echo [2/2] Downloading nginx:alpine...
docker pull nginx:alpine
if %ERRORLEVEL% equ 0 (
    echo [OK] nginx:alpine downloaded
) else (
    echo [ERROR] Failed to download nginx:alpine
    echo Try running this command manually: docker pull nginx:alpine
    goto end
)

echo.
echo [SUCCESS] All images downloaded successfully!
echo Now you can run: docker compose up -d --build
goto end

:check
echo.
echo [INFO] Checking network connectivity...
echo.
echo Testing Docker Hub:
ping -n 2 registry-1.docker.io
echo.
echo Testing DNS resolution:
nslookup registry-1.docker.io
echo.
echo Current Docker images:
docker images
goto end

:end
echo.
echo ========================================
pause
