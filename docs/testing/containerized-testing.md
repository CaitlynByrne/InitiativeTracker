# Containerized Testing Guide

This guide explains how to run all development and testing tasks inside Docker containers, ensuring consistency across different development environments.

## Overview

All development and testing for the Initiative Tracker project runs inside Docker containers. This approach ensures:

- **Consistency**: Same environment for all developers
- **Isolation**: No need to install Node.js or dependencies locally
- **Reproducibility**: Tests run the same way everywhere
- **Simplicity**: Single command to run any task

## Prerequisites

- Docker Desktop installed and running
- Git for version control
- Windows, macOS, or Linux operating system

## Quick Start

### Windows Users (Batch Scripts)

```batch
# Initial setup
scripts\setup.bat

# Start development environment
scripts\dev-start.bat

# Run all tests
scripts\test-all.bat

# Run specific component tests
scripts\test-server.bat      # Server tests only
scripts\test-dm-console.bat  # DM console tests only

# Run tests in watch mode
scripts\test-watch-server.bat  # Server watch mode
scripts\test-watch-dm.bat      # DM console watch mode
```

### Using Docker Compose Directly (All Platforms)

```bash
# Start development environment
docker-compose -f infrastructure/docker-compose.dev.yml up

# Start test infrastructure
docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test

# Run server tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test

# Run DM console tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test

# Run integration tests
docker-compose -f infrastructure/docker-compose.test.yml --profile integration run --rm integration-test

# Clean up
docker-compose -f infrastructure/docker-compose.test.yml down
```

### Linux/Mac Users (Make)

```bash
# Initial setup
make setup

# Start development
make dev

# Run tests
make test              # All tests
make test-server       # Server only
make test-dm          # DM console only
make test-watch       # Watch mode
```

## Testing Architecture

### Test Containers

The project uses separate Docker containers for testing:

1. **redis-test**: Redis instance for test data
2. **server-test**: Node.js server test runner
3. **dm-console-test**: Vue.js frontend test runner
4. **integration-test**: E2E integration test runner

### Test Configuration Files

```
infrastructure/
├── docker-compose.test.yml    # Test orchestration
server/
├── Dockerfile.test            # Server test container
├── jest.config.js            # Jest configuration
├── tests/
│   ├── setup.ts              # Test setup and mocks
│   └── **/*.test.ts          # Test files
web/dm-console/
├── Dockerfile.test            # DM console test container
├── vitest.config.ts          # Vitest configuration
├── tests/
│   ├── setup.ts              # Test setup and mocks
│   └── **/*.test.ts          # Test files
```

## Writing Tests

### Server Tests (Jest)

```typescript
// server/tests/state/StateManager.test.ts
import { describe, it, expect } from '@jest/globals';
import { StateManager } from '../../src/state/StateManager';

describe('StateManager', () => {
  it('should manage game state', async () => {
    // Test implementation
  });
});
```

### Frontend Tests (Vitest)

```typescript
// web/dm-console/tests/components/InitiativeList.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InitiativeList from '@/components/InitiativeList.vue';

describe('InitiativeList', () => {
  it('should render creatures', () => {
    // Test implementation
  });
});
```

## Test Commands Reference

### Windows Batch Scripts

Located in `scripts/` folder:

```batch
scripts\test-all.bat           # Run all tests
scripts\test-server.bat        # Server tests only
scripts\test-dm-console.bat    # DM console tests only
scripts\test-watch.bat         # All tests in watch mode
scripts\test-watch-server.bat  # Server watch mode
scripts\test-watch-dm.bat      # DM console watch mode
```

### Docker Compose Commands

```bash
# Start test infrastructure
docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test

# Run specific tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm run test:watch
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm run test:unit

# Clean up
docker-compose -f infrastructure/docker-compose.test.yml down
```

### Package.json Scripts

Both server and DM console have Docker-aware test scripts:

```json
{
  "scripts": {
    "test": "jest",                    // Run tests once
    "test:watch": "jest --watch",      // Watch mode
    "test:coverage": "jest --coverage", // Coverage report
    "test:docker": "...",              // Run in Docker
    "test:docker:watch": "...",        // Docker watch mode
    "test:docker:coverage": "..."      // Docker coverage
  }
}
```

## Coverage Reports

Coverage reports are generated in:
- `server/coverage/` - Server test coverage
- `web/dm-console/coverage/` - Frontend test coverage
- `tests/results/` - Integration test results

View HTML coverage reports:
```bash
# Windows
start server/coverage/index.html
start web/dm-console/coverage/index.html

# Linux/Mac
open server/coverage/index.html
open web/dm-console/coverage/index.html
```

## Debugging Tests

### Interactive Test Debugging

#### Windows

```batch
# Open shell in development containers
scripts\shell-server.bat
scripts\shell-dm.bat
scripts\shell-redis.bat

# Or use docker-compose directly
docker-compose -f infrastructure\docker-compose.test.yml run --rm server-test sh
docker-compose -f infrastructure\docker-compose.test.yml run --rm dm-console-test sh
```

#### All Platforms

```bash
# Open shell in test container
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test sh
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test sh

# Run tests interactively once in shell
npm test
npm run test:watch
```

### View Test Logs

#### Windows

```batch
# View development logs
scripts\dev-logs.bat

# Or use docker-compose directly
docker-compose -f infrastructure\docker-compose.test.yml logs -f
```

#### All Platforms

```bash
# View all test container logs
docker-compose -f infrastructure/docker-compose.test.yml logs

# Follow specific service logs
docker-compose -f infrastructure/docker-compose.test.yml logs -f server-test
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          docker-compose -f infrastructure/docker-compose.test.yml up --abort-on-container-exit
      - name: Upload Coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: |
            server/coverage
            web/dm-console/coverage
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Docker is not running
   Solution: Start Docker Desktop
   ```

2. **Port conflicts**
   ```
   Error: Port 3000 is already in use
   Solution: Stop conflicting services or change ports in docker-compose
   ```

3. **Permission errors**
   ```
   Error: EACCES permission denied
   Solution: Run Docker Desktop as administrator (Windows) or check Docker permissions (Linux)
   ```

4. **Out of memory**
   ```
   Error: Container killed due to memory limits
   Solution: Increase Docker Desktop memory allocation in settings
   ```

### Clean Up

#### Windows

```batch
# Clean all containers and artifacts
scripts\clean-all.bat

# Stop specific environments
scripts\dev-stop.bat
```

#### Using Docker Compose

```bash
# Stop all test containers
docker-compose -f infrastructure/docker-compose.test.yml down

# Stop development containers
docker-compose -f infrastructure/docker-compose.dev.yml down

# Remove volumes as well
docker-compose -f infrastructure/docker-compose.test.yml down -v
docker-compose -f infrastructure/docker-compose.dev.yml down -v
```

## Best Practices

1. **Always test in containers**: Ensures consistency
2. **Use watch mode during development**: Faster feedback
3. **Run full test suite before commits**: Catch issues early
4. **Generate coverage reports regularly**: Monitor test quality
5. **Keep tests isolated**: Each test should be independent
6. **Mock external dependencies**: Redis, Socket.IO, etc.
7. **Use appropriate test types**:
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for critical user flows

## Environment Variables

Test containers use these environment variables:

```env
# Server Test Environment
NODE_ENV=test
REDIS_URL=redis://redis-test:6379
PORT=3001
LOG_LEVEL=error

# DM Console Test Environment
NODE_ENV=test
VITE_API_URL=http://server-test:3001
```

## Adding New Tests

1. **Create test file** following naming convention:
   - `*.test.ts` for unit tests
   - `*.spec.ts` for integration tests

2. **Import test utilities**:
   ```typescript
   import { describe, it, expect, beforeEach } from '@jest/globals'; // Server
   import { describe, it, expect, beforeEach } from 'vitest'; // Frontend
   ```

3. **Run tests in container**:
   ```bash
   make test-watch  # Development
   make test        # CI/CD
   ```

## Summary

The containerized testing setup ensures that all developers work in the same environment, eliminating "works on my machine" issues. Use the Make commands for simplified workflows, and always run tests inside Docker containers for consistency.