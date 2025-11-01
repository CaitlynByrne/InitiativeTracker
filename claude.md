# Initiative Tracker - WebSocket Architecture

## Project Overview

A distributed, real-time initiative tracking system for tabletop role-playing games. The system coordinates turn order, timers, and game state across multiple devices using WebSocket communication.

## Target Devices

- **DM Console**: Web application (laptop/tablet browser)
- **Player Displays**: ESP32 devices with LVGL touchscreen displays
- **Shared Display**: Raspberry Pi connected to TV/monitor
- **Infrastructure**: Raspberry Pi server (Docker containers)

## Technology Stack

### Backend
- Node.js + Express
- Socket.IO (WebSocket server)
- Redis (state persistence)
- Docker + Docker Compose

### Frontend
- Vue.js 3 (DM Console & Pi Display)
- Tailwind CSS (responsive design)
- Socket.IO client

### Embedded
- ESP32 (Arduino/ESP-IDF)
- LVGL 8.x (UI framework)
- ArduinoWebsockets library
- ArduinoJson

## Project Structure

```
InitiativeTracker/
├── .claude.md                    # This file
├── README.md                     # Project readme
├── docs/                         # Documentation
│   ├── architecture/             # Architecture documentation
│   ├── requirements/             # Requirements and specifications
│   ├── user-stories/             # User stories and scenarios
│   ├── api/                      # API/event contracts
│   └── deployment/               # Deployment guides
├── server/                       # WebSocket server (Node.js)
├── web/                          # Web applications (DM + Pi)
│   ├── dm-console/              # DM web interface
│   └── pi-display/              # Raspberry Pi display app
├── firmware/                     # ESP32 firmware
│   └── player-device/           # Player device code
├── infrastructure/               # Docker, deployment configs
└── tests/                        # Integration tests
```

## Key Features

1. **Real-time synchronization** across all connected devices
2. **Initiative order management** with drag-and-drop reordering
3. **Turn timers** with countdown and expiration notifications
4. **Session persistence** with save/restore functionality
5. **Responsive UIs** adapting to different screen sizes
6. **Auto-reconnection** handling network interruptions
7. **Zero-touch operation** for Pi display (boots directly to app)

## Communication Protocol

WebSocket-based event-driven architecture using Socket.IO:
- Bidirectional real-time communication
- Automatic reconnection with exponential backoff
- Event-based message routing
- Room-based targeting for specific clients

## Development Workflow

1. Review documentation in `docs/` folder
2. Set up infrastructure (Docker containers)
3. Develop server with state management
4. Build DM console web interface
5. Build Pi display web interface
6. Develop ESP32 firmware
7. Integration testing
8. Deployment to Raspberry Pi

## Testing Guidelines

**IMPORTANT**: Never test by running Node.js applications directly on the command line. Always perform testing within Docker containers to ensure consistency and proper environment configuration. This includes:
- The WebSocket server
- The DM console web interface
- The Pi display web interface

All development servers should be run through Docker Compose, not via `npm run dev` or similar commands outside of containers.

## Getting Started

See [docs/deployment/setup-guide.md](docs/deployment/setup-guide.md) for initial setup instructions.

## Documentation Index

- [Architecture Overview](docs/architecture/overview.md)
- [System Architecture](docs/architecture/system-architecture.md)
- [WebSocket Events](docs/api/websocket-events.md)
- [User Stories](docs/user-stories/README.md)
- [Technical Requirements](docs/requirements/technical-requirements.md)
- [Deployment Guide](docs/deployment/setup-guide.md)
