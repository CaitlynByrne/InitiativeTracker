@echo off
REM Open shell in DM console development container

echo Opening shell in DM console container...
echo ========================================
echo Type 'exit' to leave the shell
echo.

cd /d "%~dp0\.."

docker-compose -f infrastructure\docker-compose.dev.yml exec dm-console sh

if errorlevel 1 (
    echo.
    echo Container not running. Starting it first...
    docker-compose -f infrastructure\docker-compose.dev.yml up -d dm-console
    timeout /t 3 /nobreak >nul
    docker-compose -f infrastructure\docker-compose.dev.yml exec dm-console sh
)