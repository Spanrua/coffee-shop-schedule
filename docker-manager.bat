@echo off
title Coffee Shop System - Docker Manager

REM Detect docker compose version
docker compose version >/dev/null 2>&1
if %ERRORLEVEL% equ 0 (
    set COMPOSE_CMD=docker compose
) else (
    set COMPOSE_CMD=docker-compose
)

:MENU
cls
echo.
echo ================================================
echo     Coffee Shop System - Docker Manager
echo ================================================
echo.
echo  [Main Operations]
echo  ================================
echo   1. Start System (background)
echo   2. Stop System
echo   3. Restart System
echo.
echo  [View Status]
echo  ================================
echo   4. View Container Status
echo   5. View All Logs
echo   6. View Backend Logs
echo   7. View Frontend Logs
echo.
echo  [Advanced]
echo  ================================
echo   8. Rebuild and Start
echo   9. Stop and Clean Data
echo   10. Open Web Browser
echo.
echo   0. Exit
echo.
echo ================================
set /p choice=Select option (0-10): 

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto LOGS_ALL
if "%choice%"=="6" goto LOGS_BACKEND
if "%choice%"=="7" goto LOGS_FRONTEND
if "%choice%"=="8" goto REBUILD
if "%choice%"=="9" goto CLEAN
if "%choice%"=="10" goto OPEN_WEB
if "%choice%"=="0" goto EXIT

echo.
echo [ERROR] Invalid option!
timeout /t 2 >/dev/null
goto MENU

:START
cls
echo.
echo [INFO] Starting system...
cd /d "%~dp0"
%COMPOSE_CMD% up -d
echo.
echo [OK] Started!
echo [WEB] http://localhost
echo [LOGIN] admin / admin123
echo.
pause
goto MENU

:STOP
cls
echo.
echo [INFO] Stopping system...
cd /d "%~dp0"
%COMPOSE_CMD% down
echo.
echo [OK] All services stopped!
echo.
pause
goto MENU

:RESTART
cls
echo.
echo [INFO] Restarting system...
cd /d "%~dp0"
%COMPOSE_CMD% restart
echo.
echo [OK] Restarted!
echo.
pause
goto MENU

:STATUS
cls
echo.
echo [INFO] Container Status:
echo ================================
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
cd /d "%~dp0"
%COMPOSE_CMD% ps
echo.
pause
goto MENU

:LOGS_ALL
cls
echo.
echo [INFO] All Logs (Press Ctrl+C to exit)
echo ================================
cd /d "%~dp0"
%COMPOSE_CMD% logs -f --tail=50
pause
goto MENU

:LOGS_BACKEND
cls
echo.
echo [INFO] Backend Logs (Press Ctrl+C to exit)
echo ================================
cd /d "%~dp0"
%COMPOSE_CMD% logs -f --tail=50 backend
pause
goto MENU

:LOGS_FRONTEND
cls
echo.
echo [INFO] Frontend Logs (Press Ctrl+C to exit)
echo ================================
cd /d "%~dp0"
%COMPOSE_CMD% logs -f --tail=50 frontend
pause
goto MENU

:REBUILD
cls
echo.
echo [INFO] Rebuilding... (this may take a few minutes)
cd /d "%~dp0"
%COMPOSE_CMD% down
%COMPOSE_CMD% up -d --build
echo.
echo [OK] Rebuild complete!
echo.
pause
goto MENU

:CLEAN
cls
echo.
echo [WARNING] This will delete all containers and data!
echo.
set /p confirm=Confirm? (Y/N): 
if /i "%confirm%"=="Y" (
    cd /d "%~dp0"
    %COMPOSE_CMD% down -v
    echo.
    echo [OK] All data cleaned!
) else (
    echo.
    echo [INFO] Cancelled
)
echo.
pause
goto MENU

:OPEN_WEB
cls
echo.
echo [INFO] Opening web browser...
start http://localhost
echo.
echo [OK] Browser opened!
echo.
timeout /t 2 >/dev/null
goto MENU

:EXIT
cls
echo.
echo Thank you! Goodbye!
echo.
timeout /t 1 >/dev/null
exit
