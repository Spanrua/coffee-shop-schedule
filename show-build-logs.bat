@echo off
echo Building frontend with detailed output...
echo.
docker compose build frontend --progress=plain --no-cache
echo.
pause
