@echo off
REM Run server tests only

echo Running Server Tests in Docker...
echo ========================================

cd /d "%~dp0\.."

echo Starting test infrastructure (Redis)...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test

echo Waiting for Redis...
timeout /t 3 /nobreak >nul

echo.
echo Running Server Tests...
docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test npm test

echo.
echo Cleaning up...
docker-compose -f infrastructure\docker-compose.test.yml down

echo.
echo Server tests completed!