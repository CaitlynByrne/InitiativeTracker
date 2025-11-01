@echo off
REM Initial project setup - builds containers and installs dependencies

echo Initiative Tracker - Initial Setup
echo ==================================
echo.
echo This will build all Docker containers and install dependencies.
echo This may take several minutes on first run...
echo.

cd /d "%~dp0\.."

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Step 1: Building development containers...
echo ------------------------------------------
docker-compose -f infrastructure\docker-compose.dev.yml build

echo.
echo Step 2: Installing server dependencies...
echo ------------------------------------------
docker-compose -f infrastructure\docker-compose.dev.yml run --rm server npm install

echo.
echo Step 3: Installing DM console dependencies...
echo ---------------------------------------------
docker-compose -f infrastructure\docker-compose.dev.yml run --rm dm-console npm install

echo.
echo Step 4: Building test containers...
echo ------------------------------------
docker-compose -f infrastructure\docker-compose.test.yml build

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now:
echo   - Start development: scripts\dev-start.bat
echo   - Run tests: scripts\test-all.bat
echo   - View available scripts in the scripts\ folder
echo.
pause