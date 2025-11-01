@echo off
REM Start development environment in background

echo Starting Initiative Tracker Development Environment (Background)...
echo ========================================

cd /d "%~dp0\.."

echo Starting development containers in background...
docker-compose -f infrastructure\docker-compose.dev.yml up -d

echo.
echo Development environment started in background!
echo.
echo Services running at:
echo - Server:     http://localhost:3000
echo - DM Console: http://localhost:5173
echo - Redis:      localhost:6379
echo.
echo To view logs, run: scripts\dev-logs.bat
echo To stop, run: scripts\dev-stop.bat