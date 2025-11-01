@echo off
REM Rebuild and start development environment

echo Rebuilding Initiative Tracker Development Environment...
echo ========================================

cd /d "%~dp0\.."

echo Stopping existing containers...
docker-compose -f infrastructure\docker-compose.dev.yml down

echo.
echo Building containers...
docker-compose -f infrastructure\docker-compose.dev.yml build

echo.
echo Starting fresh containers...
docker-compose -f infrastructure\docker-compose.dev.yml up