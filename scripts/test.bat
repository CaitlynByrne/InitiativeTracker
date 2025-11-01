@echo off
REM Test runner script for Docker containers (Windows)
REM Usage: scripts\test.bat [service] [options]

setlocal enabledelayedexpansion

REM Default values
set SERVICE=all
set WATCH_MODE=false
set COVERAGE=false

REM Parse arguments
:parse_args
if "%~1"=="" goto main
if /i "%~1"=="server" (
    set SERVICE=server
    shift
    goto parse_args
)
if /i "%~1"=="dm-console" (
    set SERVICE=dm-console
    shift
    goto parse_args
)
if /i "%~1"=="integration" (
    set SERVICE=integration
    shift
    goto parse_args
)
if /i "%~1"=="all" (
    set SERVICE=all
    shift
    goto parse_args
)
if /i "%~1"=="--watch" (
    set WATCH_MODE=true
    shift
    goto parse_args
)
if /i "%~1"=="-w" (
    set WATCH_MODE=true
    shift
    goto parse_args
)
if /i "%~1"=="--coverage" (
    set COVERAGE=true
    shift
    goto parse_args
)
if /i "%~1"=="-c" (
    set COVERAGE=true
    shift
    goto parse_args
)
if /i "%~1"=="--help" goto show_help
if /i "%~1"=="-h" goto show_help

echo Unknown option: %~1
exit /b 1

:show_help
echo Usage: scripts\test.bat [service] [options]
echo.
echo Services:
echo   server        Run server tests only
echo   dm-console    Run DM console tests only
echo   integration   Run integration tests only
echo   all           Run all tests (default)
echo.
echo Options:
echo   --watch, -w     Run tests in watch mode
echo   --coverage, -c  Generate coverage report
echo   --help, -h      Show this help message
exit /b 0

:main
echo Initiative Tracker - Test Runner
echo ================================

REM Check Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Navigate to project root
cd /d "%~dp0\.."

REM Stop any existing test containers
echo Cleaning up existing test containers...
docker-compose -f infrastructure\docker-compose.test.yml down

REM Start Redis for tests
echo Starting test infrastructure...
docker-compose -f infrastructure\docker-compose.test.yml up -d redis-test

REM Wait for Redis to be healthy
echo Waiting for Redis...
timeout /t 3 /nobreak >nul

REM Determine test command
set TEST_CMD=npm run test
if "%WATCH_MODE%"=="true" set TEST_CMD=npm run test:watch
if "%COVERAGE%"=="true" set TEST_CMD=npm run test:coverage

REM Run tests based on service selection
if /i "%SERVICE%"=="server" (
    echo Running tests for server...
    docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test %TEST_CMD%
) else if /i "%SERVICE%"=="dm-console" (
    echo Running tests for dm-console...
    docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test %TEST_CMD%
) else if /i "%SERVICE%"=="integration" (
    echo Running integration tests...
    docker-compose -f infrastructure\docker-compose.test.yml --profile integration run --rm integration-test
) else if /i "%SERVICE%"=="all" (
    echo Running tests for server...
    docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test %TEST_CMD%
    echo Running tests for dm-console...
    docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test %TEST_CMD%
    echo Running integration tests...
    docker-compose -f infrastructure\docker-compose.test.yml --profile integration run --rm integration-test
)

REM Clean up if not in watch mode
if "%WATCH_MODE%"=="false" (
    echo Cleaning up test containers...
    docker-compose -f infrastructure\docker-compose.test.yml down
)

echo Tests completed!
endlocal