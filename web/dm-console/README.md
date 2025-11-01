# Initiative Tracker - DM Console

Web-based control interface for Dungeon Masters to manage initiative order, timers, and combat state.

## Setup

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## Development

Access the dev server at: `http://localhost:5173`

The dev server automatically proxies WebSocket connections to the backend server at `http://localhost:3000`.

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - WebSocket communication

## Features (Coming Soon)

- Initiative order management
- Add/remove creatures
- Turn advancement
- Timer controls
- Drag-and-drop reordering
- Session save/restore
