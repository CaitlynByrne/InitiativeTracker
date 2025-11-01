# Environment Configuration Guide

## Overview

This document describes all environment variables used across the Initiative Tracker system components.

## Server Environment Variables

### Connection & Networking

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `PORT` | `3000` | HTTP server port for WebSocket and REST API | No |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL for state persistence | No |
| `NODE_ENV` | - | Environment mode (`development`, `production`, `test`) | No |

### CORS Configuration

By default, the server allows all origins (`*`) for development. In production, restrict this in `src/index.ts`:

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
  },
});
```

**Production Example**:
```env
ALLOWED_ORIGINS=https://dm-console.example.com,https://pi-display.example.com
```

## Frontend Environment Variables (DM Console & Pi Display)

### Connection

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `VITE_SERVER_URL` | `http://localhost:3000` | WebSocket server URL | Yes |

### Development vs Production

**Development** (`.env.development`):
```env
VITE_SERVER_URL=http://localhost:3000
```

**Production** (`.env.production`):
```env
VITE_SERVER_URL=https://api.initiative-tracker.example.com
```

## Docker Compose Configuration

### Development (`docker-compose.dev.yml`)

```yaml
services:
  redis:
    # No environment variables needed

  server:
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - PORT=3000
    ports:
      - "3000:3000"

  dm-console:
    environment:
      - VITE_SERVER_URL=http://localhost:3000
    ports:
      - "5173:5173"

  pi-display:
    environment:
      - VITE_SERVER_URL=http://localhost:3000
    ports:
      - "5174:5173"
```

### Production (`docker-compose.yml`)

```yaml
services:
  redis:
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}  # Optional

  server:
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - PORT=3000
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    ports:
      - "3000:3000"

  dm-console:
    environment:
      - VITE_SERVER_URL=${SERVER_URL}
    ports:
      - "80:80"  # Nginx serves on port 80

  pi-display:
    environment:
      - VITE_SERVER_URL=${SERVER_URL}
    ports:
      - "8080:80"
```

## Redis Configuration

### Basic Configuration

Redis runs with default configuration in Docker. For production, consider:

1. **Persistence**: Redis RDB snapshots are enabled by default
2. **Memory Limits**: Set `maxmemory` in `redis.conf`
3. **Password Protection**: Add `REDIS_PASSWORD` environment variable

### Example Production Redis Config

Create `infrastructure/redis.conf`:

```conf
# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass ${REDIS_PASSWORD}
```

Update `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  command: redis-server /usr/local/etc/redis/redis.conf
  volumes:
    - ./redis.conf:/usr/local/etc/redis/redis.conf
    - redis-data:/data
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
```

## Environment File Examples

### `.env.development` (Root of project)

```env
# Server
PORT=3000
REDIS_URL=redis://localhost:6379
NODE_ENV=development

# Frontend
VITE_SERVER_URL=http://localhost:3000
```

### `.env.production` (Root of project)

```env
# Server
PORT=3000
REDIS_URL=redis://:your_redis_password@redis:6379
NODE_ENV=production
ALLOWED_ORIGINS=https://dm.example.com,https://display.example.com

# Redis
REDIS_PASSWORD=your_secure_redis_password

# Frontend
SERVER_URL=https://api.initiative-tracker.example.com
```

## Local Development Setup

1. **No Docker** (Running services manually):

```bash
# Terminal 1 - Start Redis
redis-server

# Terminal 2 - Start Server
cd server
export REDIS_URL=redis://localhost:6379
export PORT=3000
npm run dev

# Terminal 3 - Start DM Console
cd web/dm-console
export VITE_SERVER_URL=http://localhost:3000
npm run dev

# Terminal 4 - Start Pi Display
cd web/pi-display
export VITE_SERVER_URL=http://localhost:3000
npm run dev
```

2. **With Docker** (Recommended):

```bash
cd infrastructure
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

### Using Docker Compose

1. Create `.env` file in `infrastructure/`:

```env
REDIS_PASSWORD=your_secure_password_here
SERVER_URL=https://api.initiative-tracker.example.com
ALLOWED_ORIGINS=https://dm.initiative-tracker.example.com,https://display.initiative-tracker.example.com
```

2. Start services:

```bash
cd infrastructure
docker-compose up -d
```

3. Check health:

```bash
curl http://localhost:3000/health
```

### Raspberry Pi Specific Configuration

For Pi Display running on Raspberry Pi:

1. **Auto-start on boot** - Create systemd service:

```ini
[Unit]
Description=Initiative Tracker Pi Display
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
Environment="VITE_SERVER_URL=http://your-server-ip:3000"
ExecStart=/usr/bin/docker-compose -f /home/pi/initiative-tracker/infrastructure/docker-compose.yml up pi-display
Restart=always

[Install]
WantedBy=multi-user.target
```

2. **Chromium kiosk mode** - Auto-open Pi Display:

```bash
# Add to ~/.config/lxsession/LXDE-pi/autostart
@chromium-browser --kiosk --app=http://localhost:5174
```

## Troubleshooting

### Redis Connection Failures

**Symptoms**: Server logs show "Redis client not connected"

**Solutions**:
1. Check Redis is running: `docker ps | grep redis`
2. Verify REDIS_URL matches service name in docker-compose
3. Check Redis logs: `docker logs initiative-redis-dev`

### WebSocket Connection Refused

**Symptoms**: Frontend shows "Disconnected" status

**Solutions**:
1. Verify server is running: `curl http://localhost:3000/health`
2. Check VITE_SERVER_URL matches actual server address
3. Check browser console for CORS errors
4. Verify firewall rules allow port 3000

### State Not Persisting

**Symptoms**: State lost after server restart

**Solutions**:
1. Check Redis connection in server logs
2. Verify Redis volume is mounted in docker-compose
3. Check Redis data directory: `docker exec initiative-redis-dev redis-cli KEYS "*"`
4. Verify `STATE_KEY` is being saved: `docker logs initiative-server-dev | grep "Saved to Redis"`

## Security Considerations

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` with specific domains (no wildcards)
- [ ] Set strong `REDIS_PASSWORD`
- [ ] Use HTTPS for all frontend-to-server communication
- [ ] Configure Redis `maxmemory` to prevent OOM
- [ ] Use Docker secrets instead of environment variables for sensitive data
- [ ] Enable Redis persistence (RDB + AOF)
- [ ] Set up monitoring and health checks
- [ ] Configure proper logging (not DEBUG level)

### Example Docker Secrets

1. Create secrets:

```bash
echo "your_redis_password" | docker secret create redis_password -
```

2. Update docker-compose.yml:

```yaml
secrets:
  redis_password:
    external: true

services:
  redis:
    secrets:
      - redis_password
    command: redis-server --requirepass "$(cat /run/secrets/redis_password)"

  server:
    secrets:
      - redis_password
    environment:
      - REDIS_URL=redis://:$(cat /run/secrets/redis_password)@redis:6379
```

## Monitoring & Logging

### Health Check Endpoints

- **Server**: `http://localhost:3000/health`
- **State Debug**: `http://localhost:3000/state`

### Log Levels

Set via `NODE_ENV`:

- `development`: All logs (INFO, WARN, ERROR, DEBUG)
- `production`: INFO, WARN, ERROR only
- `test`: ERROR only

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f initiative-server-dev

# Last 100 lines
docker logs --tail 100 initiative-server-dev
```

## Performance Tuning

### Redis

```env
# Increase max memory (default: 256mb)
REDIS_MAX_MEMORY=512mb

# Change eviction policy
REDIS_EVICTION_POLICY=allkeys-lfu
```

### Server

```env
# Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096
```

### Frontend

Build optimizations are automatic in production mode (`npm run build`).

---

For more information, see:
- [Setup Guide](./setup-guide.md)
- [Docker Deployment](./docker-deployment.md)
- [WebSocket Events](../api/websocket-events.md)
