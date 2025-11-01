# Initiative Tracker - WebSocket Server

Node.js + TypeScript WebSocket server for the Initiative Tracker system.

## Quick Start

### Option 1: Docker (Recommended)

Run the full stack with Docker Compose:

```bash
# Development (with hot reload)
cd ../infrastructure
docker-compose -f docker-compose.dev.yml up -d

# Production
cd ../infrastructure
docker-compose up -d
```

Server runs on `http://localhost:3000`

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start Redis (required)
cd ../infrastructure
docker-compose -f docker-compose.dev.yml up redis -d

# Run server in development mode with hot reload
cd ../server
npm run dev
```

## Development Commands

```bash
# Build for production
npm run build

# Run production build
npm start

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Development

The server uses:
- **Express** for HTTP endpoints
- **Socket.IO** for WebSocket communication
- **TypeScript** with strict mode enabled
- **ESLint + Prettier** for code quality

## Project Structure

```
server/
├── src/
│   ├── index.ts          # Entry point & server setup
│   ├── state/            # State management
│   │   └── StateManager.ts
│   ├── events/           # WebSocket event handlers
│   │   └── handlers.ts
│   ├── timer/            # Timer system
│   │   └── TimerManager.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── utils/            # Validation utilities
│       └── validation.ts
├── tests/                # Tests (coming soon)
├── Dockerfile            # Production Docker image
├── Dockerfile.dev        # Development Docker image
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### HTTP Endpoints

- `GET /health` - Server health check (returns status, uptime, timestamp)
- `GET /state` - Current game state (debugging endpoint)

### WebSocket Events

**Client → Server:**

- `identify` - Identify client type and device ID
- `state:request` - Request current state
- `creature:add` - Add creature to initiative
- `creature:remove` - Remove creature
- `turn:next` - Advance to next turn
- `initiative:reorder` - Reorder initiative list
- `timer:start` - Start countdown timer
- `timer:stop` - Stop timer
- `session:reset` - Reset game session

**Server → Client:**

- `identified` - Confirmation of identification
- `state:update` - Full state broadcast
- `timer:expired` - Timer reached zero
- `error` - Error message with details

## Docker Usage

### Development with Hot Reload

```bash
cd ../infrastructure
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f server
```

Changes to `src/` files automatically reload the server.

### Production Build

```bash
cd ../infrastructure
docker-compose up -d --build
```

### View Logs

```bash
docker-compose logs -f server
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `PORT` - Server port (default: 3000)
