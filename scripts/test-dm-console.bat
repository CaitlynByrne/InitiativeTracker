@echo off
REM Run DM console tests only

echo Running DM Console Tests in Docker...
echo ========================================

cd /d "%~dp0\.."

echo Starting test infrastructure...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test
docker-compose -f infrastructure\docker-compose.test.yml up -d server-test

echo Waiting for services...
timeout /t 3 /nobreak >nul

echo.
echo Running DM Console Tests...
docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test npm test

echo.
echo Cleaning up...
docker-compose -f infrastructure\docker-compose.test.yml down

echo.
echo DM Console tests completed!