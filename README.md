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

### Development Setup

1. **Start Redis** (required for state persistence):

   ```bash
   cd infrastructure
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Start WebSocket Server**:

   ```bash
   cd server
   npm install
   npm run dev
   ```

   Server runs on `http://localhost:3000`

3. **Start DM Console**:

   ```bash
   cd web/dm-console
   npm install
   npm run dev
   ```

   DM Console runs on `http://localhost:5173`

### Verify Setup

- Open `http://localhost:3000/health` - should show server status
- Open `http://localhost:5173` - should show DM Console with connection indicator

See [docs/deployment/setup-guide.md](docs/deployment/setup-guide.md) for complete deployment instructions.

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
└── docs/               # Documentation
```

## License

MIT License - see LICENSE file for details

## Contributing

This is a personal project, but suggestions and improvements are welcome via issues.
