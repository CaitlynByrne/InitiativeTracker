# Docker Deployment Guide

## Overview

This document describes the Docker-based deployment architecture for the Initiative Tracker server components.

## Architecture

The system uses Docker Compose to orchestrate three services:

1. **WebSocket Server** (Node.js application)
2. **Redis** (State persistence)
3. **Nginx** (Static file serving and WebSocket proxy)

All services run on a single Raspberry Pi and communicate via Docker bridge network.

---

## Docker Compose Configuration

### File: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # WebSocket Server (Node.js + Socket.IO)
  websocket-server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: initiative-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=3000
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - LOG_LEVEL=${LOG_LEVEL:-info}
    depends_on:
      - redis
    volumes:
      - ./server:/app
      - /app/node_modules
    networks:
      - initiative-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Database
  redis:
    image: redis:7-alpine
    container_name: initiative-redis
    restart: unless-stopped
    ports:
      - "6379:6379"  # Exposed for debugging, can be removed
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - initiative-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Web Server
  nginx:
    image: nginx:alpine
    container_name: initiative-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./web/dist:/usr/share/nginx/html
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - websocket-server
    networks:
      - initiative-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  initiative-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
```

---

## Service Configurations

### WebSocket Server Dockerfile

**File: `server/Dockerfile`**

```dockerfile
FROM node:18-alpine

# Install dependencies for health check
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "index.js"]
```

**For development (with hot reload):**

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm install  # Include dev dependencies

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

---

### Redis Configuration

**File: `redis/redis.conf`**

```conf
# Network
bind 0.0.0.0
protected-mode yes
port 6379

# General
daemonize no
supervised no
loglevel notice

# Persistence - RDB Snapshots
save 900 1      # Save after 900 seconds (15 min) if at least 1 key changed
save 300 10     # Save after 300 seconds (5 min) if at least 10 keys changed
save 60 10000   # Save after 60 seconds if at least 10000 keys changed

stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Persistence - AOF (Append Only File)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Memory Management
maxmemory 128mb
maxmemory-policy noeviction  # Don't evict any keys (prevent data loss)

# Security
# requirepass YourPasswordHere  # Uncomment and set password if needed

# Logging
logfile ""  # Log to stdout
```

---

### Nginx Configuration

**File: `nginx/nginx.conf`**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    include /etc/nginx/conf.d/*.conf;
}
```

**File: `nginx/conf.d/default.conf`**

```nginx
# Upstream WebSocket server
upstream websocket_backend {
    server websocket-server:3000;
}

server {
    listen 80;
    server_name _;

    # Root directory for static files
    root /usr/share/nginx/html;
    index index.html;

    # Logging
    access_log /var/log/nginx/initiative-access.log;
    error_log /var/log/nginx/initiative-error.log;

    # Static files
    location / {
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # WebSocket proxy for Socket.IO
    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;

        # WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # Buffering
        proxy_buffering off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://websocket_backend/health;
        access_log off;
    }

    # API endpoints (if any REST endpoints added)
    location /api/ {
        proxy_pass http://websocket_backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Environment Configuration

### File: `.env`

```bash
# Application Environment
NODE_ENV=production

# Server Configuration
PORT=3000

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
# REDIS_PASSWORD=  # Uncomment if using Redis password

# Logging
LOG_LEVEL=info

# CORS (if needed)
# CORS_ORIGIN=*

# Session Configuration
SESSION_SECRET=change-this-to-random-string

# Timezone
TZ=America/New_York
```

**For development:**

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

---

## Deployment Commands

### First-Time Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/InitiativeTracker.git
cd InitiativeTracker

# Create environment file
cp .env.example .env
nano .env  # Edit as needed

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Regular Start/Stop

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart websocket-server
```

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build websocket-server
```

### Monitoring

```bash
# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f websocket-server

# View resource usage
docker stats

# Check health
docker-compose ps
```

---

## Data Persistence

### Redis Data Volumes

Redis data is persisted in Docker volume `redis-data`.

**Backup:**

```bash
# Trigger Redis save
docker-compose exec redis redis-cli BGSAVE

# Copy backup file
docker cp initiative-redis:/data/dump.rdb ./backups/dump-$(date +%Y%m%d).rdb
```

**Restore:**

```bash
# Stop services
docker-compose down

# Replace dump file
docker cp ./backups/dump-20241101.rdb initiative-redis:/data/dump.rdb

# Start services
docker-compose up -d
```

**Automated Backup Script:**

```bash
#!/bin/bash
# File: scripts/backup-redis.sh

BACKUP_DIR="/home/pi/InitiativeTracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Trigger Redis save
docker-compose exec -T redis redis-cli BGSAVE

# Wait for save to complete
sleep 5

# Copy backup
docker cp initiative-redis:/data/dump.rdb "$BACKUP_DIR/dump-$DATE.rdb"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/dump-*.rdb | tail -n +31 | xargs -r rm

echo "Backup completed: dump-$DATE.rdb"
```

**Schedule with cron:**

```bash
crontab -e

# Add daily backup at 3 AM
0 3 * * * /home/pi/InitiativeTracker/scripts/backup-redis.sh >> /home/pi/logs/backup.log 2>&1
```

---

## System Service (Auto-Start)

### Systemd Service File

**File: `/etc/systemd/system/initiative-tracker.service`**

```ini
[Unit]
Description=Initiative Tracker Docker Compose Application
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/InitiativeTracker
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=pi
Group=pi

# Restart policy
Restart=on-failure
RestartSec=10s

# Environment
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable initiative-tracker.service
sudo systemctl start initiative-tracker.service
```

**Management:**

```bash
# Status
sudo systemctl status initiative-tracker

# Start
sudo systemctl start initiative-tracker

# Stop
sudo systemctl stop initiative-tracker

# Restart
sudo systemctl restart initiative-tracker

# View logs
sudo journalctl -u initiative-tracker -f
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker-compose logs

# Check specific service
docker-compose logs websocket-server

# Rebuild from scratch
docker-compose down -v  # WARNING: Removes volumes
docker-compose up -d --build
```

### Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check Redis logs
docker-compose logs redis

# Verify network
docker network inspect initiative-tracker_initiative-network
```

### WebSocket Connection Fails

```bash
# Test server health endpoint
curl http://localhost:3000/health

# Check Nginx proxy
docker-compose logs nginx

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost/socket.io/?transport=websocket
```

### Port Conflicts

```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Check what's using port 3000
sudo netstat -tulpn | grep :3000

# Kill conflicting process or change ports in docker-compose.yml
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker images
docker system prune -a

# Clean old containers
docker container prune

# Clean volumes (CAREFUL - may delete data)
docker volume prune
```

---

## Performance Tuning

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  websocket-server:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
        reservations:
          cpus: '0.5'
          memory: 128M
```

### Redis Memory Optimization

In `redis.conf`:

```conf
# For Raspberry Pi with limited RAM
maxmemory 64mb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

### Nginx Worker Processes

In `nginx.conf`:

```nginx
# For Raspberry Pi 4 (4 cores)
worker_processes 2;

# For Raspberry Pi 3 (4 cores)
worker_processes 1;
```

---

## Security Considerations

### Network Isolation

By default, services communicate on isolated Docker network. No external access except via Nginx on port 80.

### Redis Password (Optional)

If exposing Redis port externally:

1. Uncomment in `redis.conf`:
   ```conf
   requirepass YourSecurePassword
   ```

2. Update `.env`:
   ```bash
   REDIS_PASSWORD=YourSecurePassword
   ```

### Firewall Rules

```bash
# Allow only port 80
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw enable
```

### HTTPS/TLS (Optional)

For internet exposure (not recommended for this local-only app):

1. Obtain SSL certificate (Let's Encrypt)
2. Update Nginx config for HTTPS
3. Use WSS (WebSocket Secure) instead of WS

---

## Monitoring and Logging

### Log Locations

**Docker logs:**
```bash
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

**Application logs (if configured):**
```bash
./logs/server.log
```

### Log Rotation

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Metrics Collection (Optional)

Use Prometheus + Grafana for monitoring:
- Container metrics (CPU, memory, network)
- Redis metrics
- Application metrics

---

## Development vs Production

### Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  websocket-server:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    volumes:
      - ./server:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    command: npm run dev  # Hot reload
```

Run with:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Checklist

- [ ] NODE_ENV=production
- [ ] LOG_LEVEL=info or warn
- [ ] Redis persistence enabled (RDB + AOF)
- [ ] Health checks configured
- [ ] Auto-restart policies set
- [ ] Backups scheduled
- [ ] Resource limits configured
- [ ] Firewall rules applied
- [ ] systemd service enabled
