@echo off
REM Stop development environment

echo Stopping Initiative Tracker Development Environment...
echo ========================================

cd /d "%~dp0\.."

docker-compose -f infrastructure\docker-compose.dev.yml down

echo.
echo Development environment stopped.