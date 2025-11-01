@echo off
REM Run all tests in Docker containers

echo Running All Tests in Docker...
echo ========================================

cd /d "%~dp0\.."

echo Starting test infrastructure (Redis)...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test

echo Waiting for Redis to be ready...
timeout /t 3 /nobreak >nul

echo.
echo Running Server Tests...
echo ------------------------
docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test npm test

echo.
echo Running DM Console Tests...
echo ------------------------
docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test npm test

echo.
echo Running Integration Tests...
echo ------------------------
docker-compose -f infrastructure\docker-compose.test.yml --profile integration run --rm integration-test npm run test:integration

echo.
echo Cleaning up test containers...
docker-compose -f infrastructure\docker-compose.test.yml down

echo.
echo All tests completed!