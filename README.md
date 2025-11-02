# Initiative Tracker

A distributed, real-time initiative tracking system for tabletop role-playing games (D&D, Pathfinder, etc.).

## Overview

Initiative Tracker coordinates combat turn order across multiple devices in real-time:
- **Dungeon Master** controls initiative order and timers from a web console
- **Players** see their turn status on personal ESP32 touchscreen devices
- **Shared Display** shows current initiative order to the entire table
- **Infrastructure** runs on a Raspberry Pi server with automatic startup

## Features

- Real-time initiative order synchronization
- Drag-and-drop reordering of initiative
- Turn countdown timers (digital sand timer)
- Session save/restore for multi-night combats
- Player turn notifications with "on deck" indicators
- Automatic reconnection handling
- Responsive interfaces for all screen sizes
- Zero-configuration operation for player displays

## Technology

- **Backend**: Node.js, Socket.IO, Redis
- **Frontend**: Vue.js 3, Tailwind CSS
- **Embedded**: ESP32, LVGL
- **Infrastructure**: Docker, Raspberry Pi

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git for version control
- Windows, macOS, or Linux

### Development Setup (All in Docker)

#### Windows Users (Batch Scripts)

```batch
# Initial setup - builds containers and installs dependencies
scripts\setup.bat

# Start development environment with hot reload
scripts\dev-start.bat

# Or start in background
scripts\dev-start-bg.bat

# View logs
scripts\dev-logs.bat

# Stop containers
scripts\dev-stop.bat
```

#### Using Docker Compose Directly (All Platforms)

```bash
# Build and start development stack
docker-compose -f infrastructure/docker-compose.dev.yml up --build

# Or run in background
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# View logs
docker-compose -f infrastructure/docker-compose.dev.yml logs -f

# Stop containers
docker-compose -f infrastructure/docker-compose.dev.yml down
```

### Verify Setup

- Server: `http://localhost:3000/health` - should show server status
- DM Console: `http://localhost:5173` - should show DM Console with connection indicator
- Redis: Port 6379

### Testing (All in Docker)

#### Windows Users (Batch Scripts)

```batch
# Run all tests
scripts\test-all.bat

# Run specific tests
scripts\test-server.bat       # Server tests only
scripts\test-dm-console.bat   # DM console tests only

# Watch mode for development
scripts\test-watch-server.bat  # Server tests in watch mode
scripts\test-watch-dm.bat      # DM console tests in watch mode
```

#### Using Docker Compose Directly (All Platforms)

```bash
# Start test infrastructure
docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test

# Run server tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test

# Run DM console tests
docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test

# Run integration tests
docker-compose -f infrastructure/docker-compose.test.yml --profile integration run --rm integration-test

# Clean up test containers
docker-compose -f infrastructure/docker-compose.test.yml down
```

See [docs/testing/containerized-testing.md](docs/testing/containerized-testing.md) for complete testing documentation.

### Production Deployment (Raspberry Pi)

#### One-Shot Installation

For quick production deployment on a Raspberry Pi, use the automated installer:

```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash

# Or if you prefer wget
wget -qO- https://raw.githubusercontent.com/CaitlynByrne/InitiativeTracker/main/install-pi.sh | bash
```

The installer will:

- Install Docker and required dependencies
- Clone the repository
- Auto-detect your Pi's IP address
- Configure DNS settings
- Build and start all services
- Set up auto-start on boot
- Install mDNS for easy discovery

After installation, access the services at:

- **DM Console**: `http://dm.initiative` (or `http://<pi-ip>`)
- **Pi Display**: `http://player.initiative` (or `http://<pi-ip>`)

**Display Pi Kiosk Mode:** The installer can also configure a Raspberry Pi to auto-boot into fullscreen browser mode for the shared display. When prompted during installation, answer "Yes" to configure as a display Pi.

See [docs/deployment/quick-install.md](docs/deployment/quick-install.md) for detailed installation scenarios and troubleshooting.
See [docs/deployment/setup-guide.md](docs/deployment/setup-guide.md) for manual deployment instructions.

## Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [User Stories](docs/user-stories/README.md)
- [API Documentation](docs/api/websocket-events.md)
- [Technical Requirements](docs/requirements/technical-requirements.md)

## Available Scripts (Windows)

Located in the `scripts/` folder:

### Development
- `setup.bat` - Initial project setup
- `dev-start.bat` - Start development environment
- `dev-start-bg.bat` - Start in background
- `dev-stop.bat` - Stop development environment
- `dev-logs.bat` - View container logs
- `dev-rebuild.bat` - Rebuild and restart containers

### Testing
- `test-all.bat` - Run all tests
- `test-server.bat` - Run server tests only
- `test-dm-console.bat` - Run DM console tests only
- `test-watch.bat` - Run tests in watch mode
- `test-watch-server.bat` - Server tests in watch mode
- `test-watch-dm.bat` - DM console tests in watch mode

### Utilities
- `shell-server.bat` - Open shell in server container
- `shell-dm.bat` - Open shell in DM console container
- `shell-redis.bat` - Open Redis CLI
- `clean-all.bat` - Clean all containers and test artifacts

## Project Structure

```
InitiativeTracker/
├── server/              # WebSocket server
├── web/                 # Web applications
│   ├── dm-console/     # DM interface
│   └── pi-display/     # Shared display
├── firmware/            # ESP32 firmware
├── infrastructure/      # Docker configs
├── tests/               # Integration tests
├── scripts/             # Helper scripts
├── Makefile            # Linux/Mac commands
└── docs/               # Documentation
```

## Development Approach

All development and testing runs inside Docker containers:
- **No local Node.js installation required**
- **Consistent environment across all developers**
- **Isolated dependencies and configurations**
- **Hot reload enabled for rapid development**
- **All tests run in containerized environment**

## License

MIT License - see LICENSE file for details

## Contributing

This is a personal project, but suggestions and improvements are welcome via issues.
