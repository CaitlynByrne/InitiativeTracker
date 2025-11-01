@echo off
REM Start development environment with hot reload

echo Starting Initiative Tracker Development Environment...
echo ========================================

cd /d "%~dp0\.."

echo Starting development containers (Redis, Server, DM Console)...
docker-compose -f infrastructure\docker-compose.dev.yml up

echo.
echo Development environment stopped.