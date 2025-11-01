# Initiative Tracker - Infrastructure

Docker Compose configurations for development and production deployments.

## Files

- `docker-compose.dev.yml` - Development environment with hot reload
- `docker-compose.yml` - Production environment

## Development Setup

Run the full stack (Redis + Server) with hot reload:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v
```

### Development Services

- **Redis**: `localhost:6379` - State persistence
- **Server**: `localhost:3000` - WebSocket server with hot reload

The server automatically reloads when you modify files in `server/src/`.

## Production Deployment

Build and run the production stack:

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Production Services

- **Redis**: Port 6379 with persistent storage
- **Server**: Port 3000 with optimized Node.js build

## Service Management

### Check service health

```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs server
docker-compose logs redis
```

### Restart services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart server
```

### Access Redis CLI

```bash
# Development
docker exec -it initiative-redis-dev redis-cli

# Production
docker exec -it initiative-redis redis-cli
```

## Environment Variables

Server environment variables (set in docker-compose files):

- `NODE_ENV` - Environment mode (development/production)
- `REDIS_URL` - Redis connection URL
- `PORT` - Server port (default: 3000)

## Data Persistence

Redis data is stored in a Docker volume named `redis-data`. This persists across container restarts.

To backup Redis data:

```bash
# Export RDB snapshot
docker exec initiative-redis redis-cli SAVE
docker cp initiative-redis:/data/dump.rdb ./backup-dump.rdb

# Export AOF file
docker cp initiative-redis:/data/appendonly.aof ./backup-appendonly.aof
```

To restore from backup:

```bash
# Stop Redis
docker-compose down

# Copy backup files to volume
docker run --rm -v redis-data:/data -v $(pwd):/backup alpine cp /backup/dump.rdb /data/

# Start Redis
docker-compose up -d
```

## Troubleshooting

### Server won't start

Check Redis health:

```bash
docker-compose logs redis
```

The server depends on Redis being healthy before starting.

### Port conflicts

If ports 3000 or 6379 are already in use, modify the port mappings in the docker-compose file:

```yaml
ports:
  - "3001:3000"  # Map to different host port
```

### View real-time logs

```bash
docker-compose logs -f server
```

### Rebuild from scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```
