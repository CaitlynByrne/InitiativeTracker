@echo off
REM Run server tests in watch mode

echo Running Server Tests in Watch Mode...
echo =====================================
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0\.."

echo Starting test infrastructure...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test

echo Waiting for Redis...
timeout /t 3 /nobreak >nul

echo.
echo Starting server test watcher...
docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test npm run test:watch