# Docker Quick Start Guide

All development and testing runs inside Docker containers - no local Node.js installation required!

## Windows Quick Start

### First Time Setup
```batch
scripts\setup.bat
```

### Daily Development

#### Option 1: Interactive Menu (PowerShell)
```batch
scripts\menu.bat
```

#### Option 2: Direct Commands (Batch Files)
```batch
# Start development
scripts\dev-start-bg.bat

# View logs
scripts\dev-logs.bat

# Run tests
scripts\test-all.bat

# Stop everything
scripts\dev-stop.bat
```

## Direct Docker Compose Commands (All Platforms)

### Development
```bash
# Start development environment
docker-compose -f infrastructure/docker-compose.dev.yml up

# Run in background
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# View logs
docker-compose -f infrastructure/docker-compose.dev.yml logs -f

# Stop
docker-compose -f infrastructure/docker-compose.dev.yml down
```

### Testing
```bash
# Start test infrastructure
docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test

# Run server tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test

# Run DM console tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test

# Clean up
docker-compose -f infrastructure/docker-compose.test.yml down
```

## Service URLs

When running:
- **Server API**: http://localhost:3000
- **Server Health**: http://localhost:3000/health
- **DM Console**: http://localhost:5173
- **Redis**: localhost:6379

## Available Scripts

All scripts are in the `scripts/` folder:

### Development
- `setup.bat` - Initial setup
- `dev-start.bat` - Start with output
- `dev-start-bg.bat` - Start in background
- `dev-stop.bat` - Stop containers
- `dev-logs.bat` - View logs
- `dev-rebuild.bat` - Rebuild containers

### Testing
- `test-all.bat` - Run all tests
- `test-server.bat` - Server tests only
- `test-dm-console.bat` - DM tests only
- `test-watch-server.bat` - Server watch mode
- `test-watch-dm.bat` - DM watch mode

### Utilities
- `shell-server.bat` - Server shell
- `shell-dm.bat` - DM console shell
- `shell-redis.bat` - Redis CLI
- `clean-all.bat` - Clean everything
- `menu.bat` - Interactive menu (PowerShell)

## Troubleshooting

### Docker not running
```
Error: Docker is not running
Solution: Start Docker Desktop
```

### Port already in use
```
Error: Port 3000/5173 already in use
Solution: Stop other services or change ports in docker-compose.dev.yml
```

### Permission errors
```
Solution: Run as Administrator (Windows) or check Docker permissions
```

### Out of memory
```
Solution: Increase Docker Desktop memory in Settings > Resources
```

## Need Help?

- Full documentation: [docs/testing/containerized-testing.md](docs/testing/containerized-testing.md)
- Architecture: [docs/architecture/overview.md](docs/architecture/overview.md)
- WebSocket API: [docs/api/websocket-events.md](docs/api/websocket-events.md)