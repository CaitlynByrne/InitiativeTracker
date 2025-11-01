# System Architecture

## Component Architecture

### Server Components

```mermaid
graph TB
    subgraph WebSocket["WebSocket Server"]
        CM[Connection Manager<br/>- Client registration & identification<br/>- Connection lifecycle management<br/>- Room-based client grouping]
        ER[Event Router<br/>- Parse incoming events<br/>- Route to appropriate handlers<br/>- Emit outgoing events]
        IT[Initiative Tracker<br/>Business Logic<br/>- State management<br/>- Turn advancement<br/>- Timer management<br/>- Validation logic]
        SPM[State Persistence Manager<br/>- Redis interface<br/>- Save/restore operations<br/>- State serialization]

        CM --> ER
        ER --> IT
        IT --> SPM
    end
```

### Client Component Hierarchy

#### DM Console (Web)

```mermaid
graph TB
    subgraph DM["DM Console Application"]
        WSCM[WebSocket Client Manager<br/>- Connection handling<br/>- Event emission<br/>- State synchronization]
        SM[State Management - Pinia<br/>- Local state cache<br/>- Computed properties<br/>- Actions emit commands]
        UI[UI Components - Vue<br/>- InitiativeList draggable<br/>- TimerControl<br/>- CreatureForm<br/>- SessionControls]

        WSCM --> SM
        SM --> UI
    end
```

#### Pi Display (Web)

```mermaid
graph TB
    subgraph Pi["Pi Display Application"]
        WSCM2[WebSocket Client Manager]
        DM[Display Manager<br/>- View switching<br/>- Content rendering<br/>- Auto-refresh]
        UI2[UI Components<br/>- InitiativeDisplay<br/>- TimerDisplay<br/>- ImageViewer<br/>- ConditionReference]

        WSCM2 --> DM
        DM --> UI2
    end
```

#### ESP32 Player Device (Embedded)

```mermaid
graph TB
    subgraph ESP32["ESP32 Player Application"]
        WiFi[WiFi Connection Manager<br/>- Auto-connect<br/>- Credential storage]
        WSCM3[WebSocket Client Manager<br/>- Connection/reconnection<br/>- Event parsing<br/>- Message serialization]
        SM2[State Manager<br/>- Player status<br/>- Timer state]
        LVGL[LVGL UI Manager<br/>- Screen updates<br/>- Event handling<br/>- Display optimization]
        PM[Power Manager<br/>- Sleep modes<br/>- Battery monitoring]

        WiFi --> WSCM3
        WSCM3 --> SM2
        SM2 --> LVGL
        LVGL --> PM
    end
```

## Deployment Architecture

### Infrastructure Layout

```mermaid
graph TB
    subgraph RaspberryPi["Raspberry Pi Server (Infrastructure)"]
        subgraph Docker["Docker Engine"]
            WS_Server[WebSocket Server<br/>Port: 3000]
            Redis_DB[Redis Database<br/>Port: 6379]
            Nginx_Static[Nginx Static<br/>Port: 80]

            DockerNet[Docker Network bridge]
            WS_Server --- DockerNet
            Redis_DB --- DockerNet
            Nginx_Static --- DockerNet
        end

        HostNet[Host Network Interface WiFi]
        DockerNet --- HostNet
    end

    WiFiNet[Local WiFi Network<br/>192.168.1.0/24]
    HostNet --- WiFiNet

    WiFiNet --- DM_Laptop[DM Laptop]
    WiFiNet --- Pi_Display[Pi Display]
    WiFiNet --- ESP32_1[ESP32 Player 1]
    WiFiNet --- ESP32_N[ESP32 Player N]
```

### Container Configuration

#### docker-compose.yml Structure

```yaml
services:
  websocket-server:
    - Environment: NODE_ENV, REDIS_HOST, PORT
    - Depends on: redis
    - Ports: 3000:3000
    - Volumes: application code, node_modules
    - Restart: unless-stopped

  redis:
    - Volumes: persistent data storage
    - Ports: 6379 (internal only)
    - Config: AOF persistence enabled
    - Restart: unless-stopped

  nginx:
    - Volumes: static web files
    - Ports: 80:80
    - Config: WebSocket proxy pass
    - Restart: unless-stopped
```

## Network Architecture

### WiFi Topology

```mermaid
graph TB
    Router[WiFi Router<br/>DHCP Server]

    Router -->|5GHz Band<br/>Web Clients| DM[DM Laptop]
    Router -->|2.4GHz Band<br/>ESP32s| ESP32[ESP32 Players]
    Router -->|Ethernet<br/>Pi Server| Server[Server Pi]
```

**Network Configuration:**
- Server Pi: Static IP (192.168.1.100)
- DM/Display: DHCP (auto-assigned)
- ESP32 Devices: DHCP with mDNS fallback
- DNS: Local hostname resolution (raspberrypi.local)

### Port Allocation

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| WebSocket Server | 3000 | WS/HTTP | External |
| Redis | 6379 | TCP | Internal only |
| Nginx (Web) | 80 | HTTP | External |
| Nginx (WebSocket) | 80/socket.io | WS | Proxy to 3000 |

## Data Flow Architecture

### State Synchronization Flow

```mermaid
sequenceDiagram
    participant DM Console
    participant Server
    participant All Clients

    Note over DM Console: 1. User Action<br/>(Drag creature)
    DM Console->>Server: 2. Emit Event<br/>'initiative:reorder'
    Note over Server: 3. Validate<br/>Update State<br/>Persist to Redis
    Server->>All Clients: 4. Broadcast Update<br/>'state:update'
    All Clients-->>DM Console: 5. Receive & Update UI
    Note over DM Console: UI Updates
    Note over All Clients: UI Updates
```

### Timer Tick Flow

```mermaid
sequenceDiagram
    participant Timer as Server Internal Timer
    participant Server
    participant All Clients

    Note over Timer: 1. setInterval(1000ms)
    Timer->>Server: 2. Decrement timer<br/>Tick
    Note over Server: 3. Update state<br/>Check expiration
    Server->>All Clients: 4. Broadcast tick<br/>'timer:tick'
    Note over All Clients: Update Timer UI
    alt If expired
        Server->>All Clients: 5. 'timer:expired'
        Note over All Clients: Show Alert
    end
```

### Player Turn End Flow

```mermaid
sequenceDiagram
    participant ESP32 as ESP32 Player
    participant Server
    participant DM as DM Console + Pi

    Note over ESP32: 1. Player taps<br/>"End Turn"
    ESP32->>Server: 2. Emit Event<br/>'turn:end' {device_id}
    Note over Server: 3. Validate<br/>(is it their turn?)
    Note over Server: 4. Advance turn<br/>index++<br/>Update round
    Server->>ESP32: 5. Broadcast
    Server->>DM: 'state:update'
    Server->>ESP32: 6. Targeted updates<br/>'player:status'<br/>(you're no longer current)
    Server->>DM: 'player:status'<br/>(to new current player's ESP32)
    Note over ESP32: Sleep/Dim Display
    Note over DM: Update Highlight
```

## Scalability & Performance

### Connection Limits

**Current Design:**
- Max concurrent connections: 50
- Expected connections: 10-15
- Headroom: 3-5x

**Per Device Type:**
- DM Consoles: 1-2 (primary + backup)
- Pi Displays: 1-2 (main table + DM screen)
- ESP32 Players: 6-12 (typical game group)

### Performance Targets

| Metric | Target | Typical |
|--------|--------|---------|
| Event Latency | <100ms | 20-50ms |
| State Sync Time | <200ms | 50-100ms |
| Timer Precision | ±100ms | ±50ms |
| Reconnection Time | <5s | 1-3s |
| Memory (Server) | <200MB | 100-150MB |
| Memory (ESP32) | <100KB | 60-80KB |

### Bottleneck Analysis

**Potential Bottlenecks:**
1. WiFi bandwidth (2.4GHz congestion)
2. ESP32 JSON parsing speed
3. Redis write throughput (not critical path)
4. Server event loop blocking (prevented via async)

**Mitigation Strategies:**
1. Minimize message payload size
2. Use ArduinoJson streaming
3. Debounce state persistence
4. Keep event handlers non-blocking

## Resilience Patterns

### Retry Logic

**WebSocket Reconnection:**
```
Attempt 1: Immediate
Attempt 2: 1s delay
Attempt 3: 2s delay
Attempt 4: 4s delay
Attempt 5+: 5s delay (max)
Max attempts: Infinite
```

### Timeout Handling

| Operation | Timeout | Action |
|-----------|---------|--------|
| WebSocket Connect | 10s | Retry |
| State Sync | 5s | Request full state |
| Redis Write | 2s | Log error, continue |
| Event Acknowledgment | N/A | Fire-and-forget |

### State Recovery

**On Client Reconnection:**
1. Server detects new connection
2. Client sends identify event
3. Server responds with full current state
4. Client reconciles local state
5. Client updates UI to match server

**On Server Restart:**
1. Load state from Redis on startup
2. If no Redis state, start with empty session
3. Accept client connections
4. Send current state to all clients

## Monitoring & Observability

### Health Checks

**Server Health:**
- WebSocket connection count
- Redis connectivity status
- Memory usage
- Event processing rate

**Client Health:**
- Connection status (connected/disconnected)
- Last event timestamp
- Reconnection attempt count

### Logging Strategy

**Server Logs:**
- Connection events (connect, disconnect)
- State changes (with timestamp)
- Errors (with stack traces)
- Performance metrics (event processing time)

**Client Logs:**
- Connection status changes
- State sync events
- User actions
- Errors (network, parsing)

### Debugging Tools

- Chrome DevTools (WebSocket frame inspection)
- Redis CLI (state inspection)
- Docker logs (server output)
- Serial monitor (ESP32 debugging)
