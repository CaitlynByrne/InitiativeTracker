# Containerized Testing Guide

This guide explains how to run all development and testing tasks inside Docker containers, ensuring consistency across different development environments.

## Overview

All development and testing for the Initiative Tracker project now runs inside Docker containers. This approach ensures:

- **Consistency**: Same environment for all developers
- **Isolation**: No need to install Node.js or dependencies locally
- **Reproducibility**: Tests run the same way everywhere
- **Simplicity**: Single command to run any task

## Prerequisites

- Docker Desktop installed and running
- Git for version control
- Make (optional, for simplified commands)

## Quick Start

### Using Make (Recommended)

```bash
# Initial setup
make setup

# Start development environment
make dev

# Run all tests
make test

# Run specific component tests
make test-server      # Server tests only
make test-dm         # DM console tests only
make test-integration # Integration tests only

# Run tests with options
make test-watch      # Watch mode
make test-coverage   # With coverage report
```

### Using Docker Compose Directly

```bash
# Start development environment
docker-compose -f infrastructure/docker-compose.dev.yml up

# Run all tests
docker-compose -f infrastructure/docker-compose.test.yml up

# Run specific service tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test
```

### Using Test Scripts

```bash
# Windows
scripts\test.bat [service] [options]

# Linux/Mac
./scripts/test.sh [service] [options]

# Examples
scripts\test.bat all --watch        # All tests in watch mode
scripts\test.bat server --coverage  # Server tests with coverage
scripts\test.bat dm-console         # DM console tests only
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

### Make Commands

```bash
make test              # Run all tests
make test-server       # Server tests only
make test-dm          # DM console tests only
make test-integration  # Integration tests
make test-watch       # Watch mode
make test-coverage    # Coverage reports
make test-build       # Build test containers
make test-down        # Stop test containers
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

```bash
# Open shell in test container
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test sh
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test sh

# Run tests interactively
npm test
npm run test:watch
```

### View Test Logs

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

```bash
# Stop all test containers
make test-down

# Clean all test artifacts
make clean

# Full reset (removes images too)
make reset
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