@echo off
REM View development container logs

echo Viewing Development Container Logs...
echo ====================================
echo Press Ctrl+C to stop viewing logs
echo.

cd /d "%~dp0\.."

docker-compose -f infrastructure\docker-compose.dev.yml logs -f