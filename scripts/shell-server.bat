@echo off
REM Open shell in server development container

echo Opening shell in server container...
echo ====================================
echo Type 'exit' to leave the shell
echo.

cd /d "%~dp0\.."

docker-compose -f infrastructure\docker-compose.dev.yml exec server sh

if errorlevel 1 (
    echo.
    echo Container not running. Starting it first...
    docker-compose -f infrastructure\docker-compose.dev.yml up -d server
    timeout /t 3 /nobreak >nul
    docker-compose -f infrastructure\docker-compose.dev.yml exec server sh
)