@echo off
REM Clean all containers, volumes, and test artifacts

echo Cleaning Initiative Tracker Environment...
echo =========================================

cd /d "%~dp0\.."

echo Stopping all containers...
docker-compose -f infrastructure\docker-compose.yml down -v 2>nul
docker-compose -f infrastructure\docker-compose.dev.yml down -v 2>nul
docker-compose -f infrastructure\docker-compose.test.yml down -v 2>nul

echo.
echo Removing test artifacts...
if exist server\coverage rmdir /s /q server\coverage
if exist web\dm-console\coverage rmdir /s /q web\dm-console\coverage
if exist tests\results rmdir /s /q tests\results

echo.
echo Cleanup completed!