@echo off
REM Run tests in watch mode for development

echo Running Tests in Watch Mode...
echo ========================================
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0\.."

echo Starting test infrastructure...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test

echo Waiting for Redis...
timeout /t 3 /nobreak >nul

echo.
echo Starting test watchers...
echo You can run server and DM console tests in separate terminals:
echo - Server: scripts\test-watch-server.bat
echo - DM Console: scripts\test-watch-dm.bat
echo.
echo Or press Enter to run all tests in watch mode...
pause

docker-compose -f infrastructure\docker-compose.test.yml up