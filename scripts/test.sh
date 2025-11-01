#!/bin/bash

# Test runner script for Docker containers
# Usage: ./scripts/test.sh [service] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SERVICE="all"
WATCH_MODE=false
COVERAGE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    server|dm-console|integration|all)
      SERVICE="$1"
      shift
      ;;
    --watch|-w)
      WATCH_MODE=true
      shift
      ;;
    --coverage|-c)
      COVERAGE=true
      shift
      ;;
    --help|-h)
      echo "Usage: ./scripts/test.sh [service] [options]"
      echo ""
      echo "Services:"
      echo "  server        Run server tests only"
      echo "  dm-console    Run DM console tests only"
      echo "  integration   Run integration tests only"
      echo "  all           Run all tests (default)"
      echo ""
      echo "Options:"
      echo "  --watch, -w     Run tests in watch mode"
      echo "  --coverage, -c  Generate coverage report"
      echo "  --help, -h      Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Function to run tests for a specific service
run_tests() {
  local service=$1
  local container_name="initiative-${service}-test"

  echo -e "${YELLOW}Running tests for ${service}...${NC}"

  # Build the test command
  local test_cmd="npm run test"
  if [ "$WATCH_MODE" = true ]; then
    test_cmd="npm run test:watch"
  fi
  if [ "$COVERAGE" = true ]; then
    test_cmd="npm run test:coverage"
  fi

  # Run the tests
  docker-compose -f infrastructure/docker-compose.test.yml \
    run --rm "${service}-test" ${test_cmd}
}

# Function to check if Docker is running
check_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
  fi
}

# Main execution
echo -e "${GREEN}Initiative Tracker - Test Runner${NC}"
echo "================================"

# Check Docker is running
check_docker

# Navigate to project root
cd "$(dirname "$0")/.."

# Stop any existing test containers
echo -e "${YELLOW}Cleaning up existing test containers...${NC}"
docker-compose -f infrastructure/docker-compose.test.yml down

# Start Redis for tests
echo -e "${YELLOW}Starting test infrastructure...${NC}"
docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test

# Wait for Redis to be healthy
echo -e "${YELLOW}Waiting for Redis...${NC}"
sleep 3

# Run tests based on service selection
case $SERVICE in
  server)
    run_tests "server"
    ;;
  dm-console)
    run_tests "dm-console"
    ;;
  integration)
    echo -e "${YELLOW}Running integration tests...${NC}"
    docker-compose -f infrastructure/docker-compose.test.yml \
      --profile integration run --rm integration-test
    ;;
  all)
    run_tests "server"
    run_tests "dm-console"
    echo -e "${YELLOW}Running integration tests...${NC}"
    docker-compose -f infrastructure/docker-compose.test.yml \
      --profile integration run --rm integration-test
    ;;
esac

# Clean up if not in watch mode
if [ "$WATCH_MODE" = false ]; then
  echo -e "${YELLOW}Cleaning up test containers...${NC}"
  docker-compose -f infrastructure/docker-compose.test.yml down
fi

echo -e "${GREEN}Tests completed!${NC}"