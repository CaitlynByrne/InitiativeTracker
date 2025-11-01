@echo off
REM Open Redis CLI

echo Opening Redis CLI...
echo ====================
echo Type 'exit' to leave
echo.

cd /d "%~dp0\.."

docker-compose -f infrastructure\docker-compose.dev.yml exec redis redis-cli

if errorlevel 1 (
    echo.
    echo Redis not running. Starting it first...
    docker-compose -f infrastructure\docker-compose.dev.yml up -d redis
    timeout /t 3 /nobreak >nul
    docker-compose -f infrastructure\docker-compose.dev.yml exec redis redis-cli
)