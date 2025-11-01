@echo off
REM Run DM console tests in watch mode

echo Running DM Console Tests in Watch Mode...
echo ========================================
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0\.."

echo Starting test infrastructure...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test
docker-compose -f infrastructure\docker-compose.test.yml up -d server-test

echo Waiting for services...
timeout /t 5 /nobreak >nul

echo.
echo Starting DM console test watcher...
docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test npm run test:unit