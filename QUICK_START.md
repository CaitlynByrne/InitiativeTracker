# Quick Start Guide - Initiative Tracker MVP

## 🚀 Start the System (Easiest Method)

```bash
cd infrastructure
docker-compose -f docker-compose.dev.yml up
```

That's it! Now open:
- **DM Console**: http://localhost:5173
- **Pi Display**: http://localhost:5174

---

## 🎮 How to Use

### DM Console (http://localhost:5173)

1. **Add Creatures**:
   - Fill in name, initiative, type
   - Click "Add to Initiative"
   - Creatures auto-sort by initiative

2. **Start Combat**:
   - Click "Start Combat" button
   - First creature becomes CURRENT

3. **Advance Turns**:
   - Click "Next Turn" to move to next creature
   - Round auto-increments when wrapping

4. **Use Timer**:
   - Click "30s", "60s", or "120s" to start timer
   - Timer counts down in real-time
   - Click "Stop Timer" to cancel

5. **Reset Session**:
   - Click "Reset Session" to clear all data
   - Confirmation dialog will appear

### Pi Display (http://localhost:5174)

This is a **read-only view** optimized for TVs/monitors:
- Shows current turn in large text
- Displays timer countdown
- Shows next creature up
- Lists all creatures at bottom
- Auto-updates when DM makes changes

---

## 📊 Verify Everything Works

### 1. Check Server Status

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 2. Check Current State

```bash
curl http://localhost:3000/state
# Should return: {"creatures":[],"currentTurnIndex":-1,"currentRound":0,"timer":null}
```

### 3. Check Redis

```bash
docker exec initiative-redis-dev redis-cli PING
# Should return: PONG
```

### 4. View Server Logs

```bash
docker logs -f initiative-server-dev
```

Look for:
- `[INFO] Redis client ready`
- `[INFO] State loaded from Redis successfully`
- `[INFO] Initiative Tracker Server running on port 3000`

---

## 🔧 Stop the System

```bash
# Stop all services
cd infrastructure
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (clears all data)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
netstat -an | grep "3000\|5173\|5174\|6379"

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

### Frontend Shows "Disconnected"

1. Check server is running:
   ```bash
   curl http://localhost:3000/health
   ```

2. Check browser console for errors

3. Verify VITE_SERVER_URL in docker-compose.dev.yml matches server address

### State Not Persisting

1. Check Redis logs:
   ```bash
   docker logs initiative-redis-dev
   ```

2. Check server logs for "Saved to Redis":
   ```bash
   docker logs initiative-server-dev | grep "Saved to Redis"
   ```

3. Verify Redis volume exists:
   ```bash
   docker volume ls | grep initiative
   ```

---

## 📝 New Features Added Today

### 1. Redis Persistence ✅

State now automatically saves to Redis after every change. Your game state persists even if the server restarts!

### 2. Session Save/Restore ✅

WebSocket events for manual session management:

```typescript
// Save session (manual confirmation)
socket.emit('session:save', { name: 'My Game' });

// Restore session
socket.emit('session:restore');
```

**Note**: State auto-saves on every change, so explicit save is optional.

### 3. Updated Tests ✅

Integration tests now match the current implementation. Run them with:

```bash
cd server
npm test
```

---

## 🎯 Quick Demo Workflow

1. **Start Services**:
   ```bash
   cd infrastructure
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Open DM Console**: http://localhost:5173

3. **Add 3 Creatures**:
   - "Gandalf" - Initiative 18 - Player
   - "Goblin Chief" - Initiative 15 - Monster
   - "Legolas" - Initiative 12 - Player

4. **Click "Start Combat"** - Gandalf becomes current turn

5. **Open Pi Display**: http://localhost:5174 (in another window/screen)

6. **Click "Next Turn"** on DM Console
   - Watch both displays update instantly!
   - Goblin Chief becomes current

7. **Start 30s Timer** on DM Console
   - Watch countdown on both screens
   - Pi Display shows red/pulsing when <10s

8. **Click "Reset Session"** when done
   - All creatures cleared
   - Ready for next game

9. **Restart Server**:
   ```bash
   docker restart initiative-server-dev
   ```
   - Refresh DM Console
   - State is restored from Redis!

---

## 📱 For Raspberry Pi Display

### Setup Pi to Auto-Load Display

1. Install Chromium on Pi
2. Create autostart script:

```bash
# Edit: ~/.config/lxsession/LXDE-pi/autostart
@chromium-browser --kiosk --app=http://your-server-ip:5174
```

3. Set Docker to auto-start:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

4. Create systemd service for auto-start on boot (see environment-configuration.md)

---

## 🔐 Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` (no wildcards)
- [ ] Set strong `REDIS_PASSWORD`
- [ ] Use HTTPS for frontend-server communication
- [ ] Configure Redis persistence (RDB + AOF)
- [ ] Set up monitoring and alerts
- [ ] Configure log rotation
- [ ] Test backup/restore procedures

See `docs/deployment/environment-configuration.md` for full details.

---

## 📚 More Information

- **Complete Documentation**: See `/docs` folder
- **Environment Setup**: `docs/deployment/environment-configuration.md`
- **API Reference**: `docs/api/websocket-events.md`
- **Architecture**: `docs/architecture/system-architecture.md`
- **Completion Summary**: `COMPLETION_SUMMARY.md`

---

## 🎉 You're Ready to Go!

The system is 100% complete and ready for real gaming sessions. Have fun tracking initiative! 🎲

**Questions?** Check the docs or review the code - everything is well-documented.
