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
- Make (optional, for simplified commands)

### Development Setup (All in Docker)

#### Using Make (Recommended)

```bash
# Initial setup - builds containers and installs dependencies
make setup

# Start development environment with hot reload
make dev

# View logs
make dev-logs
```

#### Using Docker Compose

```bash
# Start entire development stack
cd infrastructure
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d
```

### Verify Setup

- Server: `http://localhost:3000/health` - should show server status
- DM Console: `http://localhost:5173` - should show DM Console with connection indicator
- Redis: Port 6379 (use `make shell-redis` to access Redis CLI)

### Testing (All in Docker)

```bash
# Run all tests
make test

# Run specific tests
make test-server      # Server tests only
make test-dm         # DM console tests only
make test-integration # Integration tests

# Run with options
make test-watch      # Watch mode for development
make test-coverage   # Generate coverage reports
```

See [docs/testing/containerized-testing.md](docs/testing/containerized-testing.md) for complete testing documentation.
See [docs/deployment/setup-guide.md](docs/deployment/setup-guide.md) for production deployment instructions.

## Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [User Stories](docs/user-stories/README.md)
- [API Documentation](docs/api/websocket-events.md)
- [Technical Requirements](docs/requirements/technical-requirements.md)

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
├── Makefile            # Simplified commands
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
