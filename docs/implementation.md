# Initiative Tracker Implementation Plan

## Project Overview

The Initiative Tracker is a distributed real-time system for managing combat turn order in tabletop RPGs. It synchronizes state across:
- **DM Console** (web-based control interface)
- **Pi Display** (shared table display)
- **ESP32 Player Devices** (personal turn trackers)
- **WebSocket Server** (central coordinator on Raspberry Pi)

## Implementation Roadmap

This plan breaks down development into four phases:
1. **Phase 0: Foundation** - Basic infrastructure
2. **Phase 1: MVP** - Core functionality for minimal viable product
3. **Phase 2: Production-Ready** - Full feature set with reliability
4. **Phase 3: Enhancement** - Advanced features and polish

---

## Phase 0: Foundation Setup

**Goal:** Establish development environment and basic infrastructure

**Timeline:** 1-2 days

### 0.1 Project Structure Setup

**Tasks:**
- [ ] Create directory structure
  ```
  InitiativeTracker/
  ├── server/              # WebSocket server (Node.js)
  │   ├── src/
  │   ├── tests/
  │   ├── package.json
  │   └── README.md
  ├── web/                 # Web applications
  │   ├── dm-console/     # Vue.js DM interface
  │   └── pi-display/     # Vue.js shared display
  ├── firmware/            # ESP32 firmware (C++/LVGL)
  │   ├── src/
  │   ├── lib/
  │   └── platformio.ini
  ├── infrastructure/      # Docker configs
  │   ├── docker-compose.yml
  │   └── nginx/
  └── docs/               # Documentation (already exists)
  ```

- [ ] Initialize Node.js server project
  - npm init
  - Install core dependencies: `express`, `socket.io`, `redis`
  - Setup TypeScript (optional but recommended)
  - Configure ESLint/Prettier

- [ ] Initialize Vue.js projects
  - Create `dm-console` with Vue CLI or Vite
  - Create `pi-display` with Vue CLI or Vite
  - Install: `vue`, `socket.io-client`, `tailwindcss`

- [ ] Initialize ESP32 firmware project
  - Setup PlatformIO
  - Configure for ESP32 target
  - Add LVGL library
  - Add WiFi and WebSocket libraries (ArduinoWebSockets)

**Deliverables:**
- Runnable "Hello World" for each component
- Build scripts for all components
- README with setup instructions

---

### 0.2 Development Environment

**Tasks:**
- [ ] Setup local Redis instance (Docker or native)
- [ ] Create docker-compose for local development
  ```yaml
  services:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
    server:
      build: ./server
      ports:
        - "3000:3000"
      environment:
        - REDIS_URL=redis://redis:6379
  ```

- [ ] Setup hot reload for web development
- [ ] Configure VS Code workspace settings
- [ ] Create development documentation

**Deliverables:**
- One-command startup for local dev environment
- Developer setup guide

---

## Phase 1: MVP (Minimum Viable Product)

**Goal:** Demonstrate core functionality end-to-end

**Timeline:** 1-2 weeks

**MVP Scope:**
- Add/remove creatures to initiative
- Display initiative order on DM console and Pi display
- Advance turns manually
- Basic turn timer
- Real-time synchronization between devices

**Out of Scope for MVP:**
- Session save/restore
- ESP32 player devices
- Drag-and-drop reordering
- Display content switching
- Advanced error handling

---

### 1.1 Server Core - State Management

**Priority:** Critical
**Dependencies:** Phase 0

**Tasks:**
- [ ] Implement state data model
  ```typescript
  interface GameState {
    session_id: string;
    current_turn_index: number;
    round: number;
    timer: {
      active: boolean;
      remaining: number;
      duration: number;
    };
    initiative_order: Creature[];
    metadata: {
      created_at: string;
      last_modified: string;
    };
  }

  interface Creature {
    id: string;
    name: string;
    initiative: number;
    type: 'player' | 'npc';
    device_id?: string;
  }
  ```

- [ ] Create StateManager class
  - Singleton pattern for single source of truth
  - Methods: `getState()`, `updateState()`, `addCreature()`, `removeCreature()`, etc.
  - Input validation for all mutations
  - Emit events on state changes

- [ ] Implement in-memory state storage
  - Initialize with empty/default state
  - Thread-safe operations (Node.js single-threaded, but consider async)

**Tests:**
- [ ] Unit tests for state mutations
- [ ] Validation tests (invalid inputs rejected)

**Deliverables:**
- Working StateManager with tests
- State manipulation functions

---

### 1.2 Server Core - WebSocket Server

**Priority:** Critical
**Dependencies:** 1.1

**Tasks:**
- [ ] Setup Socket.IO server
  ```typescript
  const io = new Server(server, {
    cors: { origin: "*" } // For development
  });
  ```

- [ ] Implement connection handling
  - Accept connections
  - Handle `identify` event
  - Store client metadata (type, device_id)
  - Send initial `state:update` on connection

- [ ] Implement event handlers
  - `creature:add` → Add to state → Broadcast `state:update`
  - `creature:remove` → Remove from state → Broadcast `state:update`
  - `turn:next` → Advance turn → Broadcast `state:update`
  - `state:request` → Send `state:update`

- [ ] Implement broadcast mechanism
  - Broadcast to all connected clients
  - Room-based messaging (for targeted events later)

**Tests:**
- [ ] Integration tests with mock Socket.IO clients
- [ ] Event flow tests (send command → verify broadcast)

**Deliverables:**
- WebSocket server accepting connections
- Event handlers for core operations
- Broadcast working to all clients

---

### 1.3 Server Core - Timer System

**Priority:** High
**Dependencies:** 1.2

**Tasks:**
- [ ] Implement timer logic
  ```typescript
  class TimerManager {
    private interval: NodeJS.Timer | null;

    start(duration: number): void;
    stop(): void;
    tick(): void; // Called every second
  }
  ```

- [ ] Integrate with StateManager
  - Update state.timer on start/stop
  - Decrement `remaining` each second

- [ ] Implement timer events
  - `timer:start` → Start countdown
  - `timer:stop` → Stop countdown
  - `timer:tick` → Broadcast every second (optional, state:update includes timer)
  - `timer:expired` → Broadcast when reaches 0

- [ ] Handle timer cleanup
  - Stop timer on server shutdown
  - Clear intervals properly

**Tests:**
- [ ] Timer accuracy tests (±200ms acceptable)
- [ ] Timer expiration tests
- [ ] Concurrent timer operations

**Deliverables:**
- Working timer system
- Timer synchronized across all clients

---

### 1.4 DM Console - Basic UI

**Priority:** Critical
**Dependencies:** 1.2

**Tasks:**
- [ ] Create Vue.js application structure
  - Setup routing (single page for MVP)
  - Configure Tailwind CSS
  - Setup Socket.IO client

- [ ] Implement Socket.IO connection
  ```typescript
  import { io } from 'socket.io-client';

  const socket = io('http://localhost:3000');
  socket.emit('identify', { type: 'dm' });
  socket.on('state:update', (state) => {
    // Update UI
  });
  ```

- [ ] Create initiative list component
  - Display creatures in order
  - Show initiative values
  - Highlight current turn
  - Show round number

- [ ] Create add creature form
  - Input: name, initiative, type
  - Emit `creature:add` event
  - Clear form on submit

- [ ] Create turn controls
  - "Next Turn" button → emit `turn:next`
  - Show current creature prominently

- [ ] Create timer controls
  - Duration selector (30s, 60s, 90s, 120s)
  - "Start Timer" button
  - "Stop Timer" button (shown when active)
  - Display countdown

- [ ] Implement state synchronization
  - Store state in Vue reactive ref/store
  - Update UI on `state:update` events
  - Show connection status indicator

**Styling:**
- Clean, functional design
- Large touch-friendly buttons (44x44px minimum)
- High contrast for readability
- Responsive layout (works on tablet and desktop)

**Deliverables:**
- Functional DM console
- Can add creatures, advance turns, start timers
- Real-time updates from server

---

### 1.5 Pi Display - Basic View

**Priority:** High
**Dependencies:** 1.2

**Tasks:**
- [ ] Create Vue.js application structure
  - Single page view
  - No user input controls (read-only)
  - Fullscreen mode

- [ ] Implement Socket.IO connection
  ```typescript
  const socket = io('http://localhost:3000');
  socket.emit('identify', { type: 'pi' });
  ```

- [ ] Create initiative list display
  - Large text readable from 6-8 feet
  - Current turn highlighted prominently
  - Next creature ("on deck") indicated
  - Round number displayed
  - Timer countdown (if active)

- [ ] Implement auto-scaling
  - Responsive to different resolutions (720p, 1080p, 4K)
  - Font sizes scale with viewport
  - Use vh/vw units

- [ ] Style for visibility
  - High contrast colors
  - Dark background, light text
  - Thick borders for current turn
  - Large font sizes (3-4em for names)

**Deliverables:**
- Fullscreen Pi display view
- Synchronized with DM console
- Readable from distance

---

### 1.6 MVP Integration & Testing

**Priority:** Critical
**Dependencies:** 1.1-1.5

**Tasks:**
- [ ] End-to-end integration testing
  - Start server
  - Open DM console
  - Open Pi display
  - Add creatures → verify both show update
  - Advance turn → verify both update
  - Start timer → verify countdown on both

- [ ] Network latency testing
  - Measure time from event to UI update
  - Target: <100ms on local network

- [ ] Multi-client testing
  - Open multiple DM consoles
  - Verify all stay synchronized

- [ ] Basic error handling
  - Handle disconnections gracefully
  - Auto-reconnect on network recovery
  - Resync state on reconnection

**Deliverables:**
- Working demo with DM console and Pi display
- All core features functional
- Real-time synchronization verified

---

### 1.7 MVP Deployment

**Priority:** High
**Dependencies:** 1.6

**Tasks:**
- [ ] Create production Docker images
  ```dockerfile
  # server/Dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --production
  COPY . .
  CMD ["node", "src/server.js"]
  ```

- [ ] Create docker-compose for production
  ```yaml
  services:
    redis:
      image: redis:7-alpine
      volumes:
        - redis-data:/data

    server:
      build: ./server
      ports:
        - "3000:3000"
      depends_on:
        - redis

    nginx:
      image: nginx:alpine
      ports:
        - "80:80"
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf
        - ./web/dist:/usr/share/nginx/html
  ```

- [ ] Build web applications for production
  - `npm run build` for both Vue apps
  - Minified assets

- [ ] Setup Nginx reverse proxy
  - Serve static files (dm-console, pi-display)
  - Proxy WebSocket connections to server
  - Enable CORS for development

- [ ] Test on Raspberry Pi
  - Deploy Docker containers
  - Verify performance
  - Test auto-start on boot (systemd)

**Deliverables:**
- Production-ready Docker deployment
- Deployment documentation
- Raspberry Pi installation guide

---

## Phase 2: Production-Ready

**Goal:** Complete all critical features, add reliability and persistence

**Timeline:** 2-3 weeks

**Scope:**
- Session save/restore
- Drag-and-drop reordering
- ESP32 player devices
- Comprehensive error handling
- State persistence with Redis
- Improved UX/UI

---

### 2.1 State Persistence - Redis Integration

**Priority:** High
**Dependencies:** 1.7

**Tasks:**
- [ ] Implement Redis client wrapper
  ```typescript
  class StateRepository {
    async save(state: GameState): Promise<void>;
    async load(): Promise<GameState | null>;
    async saveSession(name: string, state: GameState): Promise<void>;
    async restoreSession(name: string): Promise<GameState | null>;
    async listSessions(): Promise<SessionMetadata[]>;
  }
  ```

- [ ] Integrate with StateManager
  - Auto-save on every state change (debounced 500ms)
  - Save to key: `initiative:state`
  - Enable Redis persistence (RDB + AOF)

- [ ] Implement state recovery
  - Load state from Redis on server startup
  - Use default state if Redis empty
  - Handle Redis connection failures gracefully

**Tests:**
- [ ] Save/load roundtrip tests
- [ ] Redis unavailability handling
- [ ] Concurrent save operations

**Deliverables:**
- State persists across server restarts
- Graceful fallback if Redis unavailable

---

### 2.2 Session Management

**Priority:** High
**Dependencies:** 2.1

**Tasks:**
- [ ] Implement save/restore events
  - `state:save` → Save to `initiative:saved:{name}`
  - `state:restore` → Load from saved session
  - `state:list_saves` → Return list of saved sessions
  - `session:clear` → Reset to empty state

- [ ] Add session metadata
  - Save timestamp
  - Creature count
  - Round number
  - User-provided name

- [ ] Create DM console UI
  - "Save Session" button → modal with name input
  - "Restore Session" button → modal with list of saves
  - "Clear Combat" button → confirmation dialog
  - Show last save timestamp

- [ ] Implement session list view
  - Display saves with name, date, creature count
  - Sort by most recent
  - Click to restore

**Tests:**
- [ ] Save/restore functional tests
- [ ] Session list display tests
- [ ] Overwrite protection tests

**Deliverables:**
- Working save/restore functionality
- DM can resume multi-session combats

---

### 2.3 Drag-and-Drop Initiative Reordering

**Priority:** Medium
**Dependencies:** 1.4

**Tasks:**
- [ ] Implement drag-and-drop in DM console
  - Use VueDraggable or similar library
  - Visual feedback during drag
  - Smooth animations

- [ ] Implement `initiative:reorder` event
  - Send full new order array
  - Validate on server (same IDs)
  - Broadcast update

- [ ] Handle current turn preservation
  - Keep current_turn_index pointing to same creature
  - Update index if creature moved

- [ ] Touch-friendly drag handles
  - Large drag handles on mobile
  - Alternative: Up/Down buttons for mobile

**Tests:**
- [ ] Drag operations update all clients
- [ ] Current turn preserved correctly
- [ ] Touch interaction works

**Deliverables:**
- DM can reorder initiative via drag-and-drop
- Works on desktop and tablet

---

### 2.4 ESP32 Player Devices - Firmware

**Priority:** High
**Dependencies:** 1.2

**Tasks:**
- [ ] Setup PlatformIO environment
  - Configure for ESP32 target (ESP32-DevKitC or similar)
  - Add libraries: LVGL, WiFi, ArduinoJson, ArduinoWebsockets

- [ ] Implement WiFi connection
  - Hardcoded SSID/password (or WiFiManager for config)
  - Auto-reconnect on disconnection
  - Connection status LED

- [ ] Implement WebSocket client
  ```cpp
  WebSocketsClient webSocket;

  void setup() {
    webSocket.begin("192.168.1.100", 3000, "/socket.io/");
    webSocket.onEvent(webSocketEvent);
  }

  void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    // Handle events
  }
  ```

- [ ] Implement device identification
  - Send `identify` event with type='player', device_id
  - Receive `state:update` and `player:status` events

- [ ] Create LVGL UI
  - Main screen showing:
    - Player name
    - "Your Turn" / "On Deck" / "Waiting" status
    - Position in initiative order
    - Timer countdown (if active)
    - "End Turn" button (enabled only when active)
    - Connection status indicator

- [ ] Implement turn end button
  - Emit `turn:end` with device_id
  - Only enabled during player's turn
  - Visual feedback on press

- [ ] Implement display power management
  - Brighten screen when turn starts (`is_current: true`)
  - Dim screen when not turn (save battery)
  - Configurable brightness levels

**Hardware:**
- ESP32 module (ESP32-DevKitC, TTGO T-Display, etc.)
- Display: 2.4" TFT (320x240) or e-ink
- Battery: LiPo 500-1000mAh
- Enclosure: 3D printed case

**Tests:**
- [ ] WiFi connection tests
- [ ] WebSocket message parsing
- [ ] UI rendering tests
- [ ] Button input tests

**Deliverables:**
- Functional ESP32 firmware
- Player can see turn status
- Player can end turn via device

---

### 2.5 ESP32 Player Devices - Server Integration

**Priority:** High
**Dependencies:** 2.4

**Tasks:**
- [ ] Implement targeted `player:status` events
  ```typescript
  function sendPlayerStatus(deviceId: string, state: GameState) {
    const creature = findCreatureByDeviceId(deviceId);
    const status = {
      is_current: isCurrentTurn(creature),
      is_on_deck: isOnDeck(creature),
      position: getPosition(creature),
      timer: state.timer
    };
    io.to(deviceId).emit('player:status', status);
  }
  ```

- [ ] Implement Socket.IO rooms for targeting
  - Join client to room based on device_id
  - Send targeted messages to specific rooms

- [ ] Implement `turn:end` validation
  - Verify device_id matches current turn creature
  - Reject if not current turn
  - Advance turn if valid

- [ ] Send player status on state changes
  - On turn advance → notify new current and on-deck players
  - On timer tick → update all players
  - On reconnect → send full status

**Tests:**
- [ ] Targeted message delivery
- [ ] Turn end authorization tests
- [ ] Player status accuracy

**Deliverables:**
- ESP32 devices receive correct turn status
- Players can end turns from devices
- Validation prevents unauthorized turn ends

---

### 2.6 Enhanced Error Handling

**Priority:** High
**Dependencies:** All previous

**Tasks:**
- [ ] Implement comprehensive input validation
  - Validate all event payloads (schema validation)
  - Return `error` events for invalid inputs
  - Log validation failures

- [ ] Implement error event handling
  ```typescript
  socket.emit('error', {
    message: 'Invalid initiative value',
    code: 'VALIDATION_ERROR',
    details: { field: 'initiative', value: 150 }
  });
  ```

- [ ] Add client-side error handling
  - Display error messages to user
  - Toast notifications for non-critical errors
  - Modal dialogs for critical errors

- [ ] Implement reconnection logic
  - Auto-reconnect with exponential backoff
  - Request state resync on reconnect
  - Show "Reconnecting..." indicator

- [ ] Add server logging
  - Winston or Pino for structured logging
  - Log all events, errors, connections
  - Different log levels for dev/prod

- [ ] Implement graceful shutdown
  - Save state on SIGTERM/SIGINT
  - Close connections cleanly
  - Notify clients of shutdown

**Tests:**
- [ ] Validation error tests
- [ ] Network interruption recovery tests
- [ ] Server restart recovery tests

**Deliverables:**
- Robust error handling throughout system
- Clear error messages for users
- Automatic recovery from common failures

---

### 2.7 UI/UX Improvements

**Priority:** Medium
**Dependencies:** 1.4, 1.5

**Tasks:**
- [ ] DM Console enhancements
  - Confirmation dialogs for destructive actions
  - Loading indicators for async operations
  - Success/error toast notifications
  - Keyboard shortcuts (Space=Next Turn, etc.)
  - Accessibility improvements (ARIA labels)

- [ ] Pi Display enhancements
  - Animations for turn changes
  - Timer expiration visual alert (flash screen)
  - Better contrast/visibility
  - Support for different screen sizes

- [ ] Visual design polish
  - Consistent color scheme
  - Professional typography
  - Icon set (Heroicons or similar)
  - Smooth transitions and animations

- [ ] Mobile optimization
  - Touch-friendly controls
  - Responsive layouts
  - Prevent accidental zooming
  - PWA manifest for "Add to Home Screen"

**Deliverables:**
- Polished, professional UI
- Better user experience
- Accessibility compliant (WCAG AA)

---

### 2.8 Testing & QA

**Priority:** High
**Dependencies:** All Phase 2 features

**Tasks:**
- [ ] Comprehensive integration tests
  - Test all user stories
  - Multi-device scenarios
  - Network failure scenarios

- [ ] Performance testing
  - Latency measurements (<100ms target)
  - Load testing (20 concurrent connections)
  - Memory usage profiling
  - Battery life testing for ESP32

- [ ] Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers (iOS Safari, Chrome)

- [ ] Manual testing checklist
  - Create test scenarios for all features
  - Test on actual hardware (Raspberry Pi, ESP32)
  - Test with real game session

- [ ] Bug fixes
  - Address all critical bugs
  - Document known issues

**Deliverables:**
- Test coverage >70% (server)
- Documented test results
- Bug-free critical path

---

## Phase 3: Enhancement & Polish

**Goal:** Add advanced features and prepare for long-term use

**Timeline:** 1-2 weeks

**Scope:**
- Display content switching
- Advanced timer features
- Turn history
- System monitoring
- Documentation & polish

---

### 3.1 Display Content Switching

**Priority:** Medium
**Dependencies:** 2.7

**Tasks:**
- [ ] Implement content display events
  - `display:show_content` (DM → Server)
  - `display:content` (Server → Pi)
  - `display:show_initiative` (return to initiative view)
  - `display:mode` (set view mode)

- [ ] Add content types support
  - Images (JPG, PNG)
  - Condition descriptions (text)
  - Maps (future: interactive maps)

- [ ] Create DM console content controls
  - "Show Image" button
  - "Show Condition" button
  - Predefined condition library
  - Image upload/selection
  - "Back to Initiative" button

- [ ] Implement Pi display content view
  - Toggle between initiative and content views
  - Image display with proper scaling
  - Text display with readable formatting
  - Smooth transitions

- [ ] Create content library
  - Predefined D&D 5e conditions
  - Placeholder images for testing
  - Asset management system

**Tests:**
- [ ] Content display within 1 second
- [ ] Image scaling tests (various resolutions)
- [ ] Mode switching tests

**Deliverables:**
- DM can show reference content on shared display
- Support for images and conditions
- Easy switch back to initiative

---

### 3.2 Advanced Timer Features

**Priority:** Low
**Dependencies:** 2.1

**Tasks:**
- [ ] Timer presets
  - Configurable preset durations
  - "Quick Start" buttons for each preset
  - Persist presets in settings

- [ ] Timer pause/resume
  - Pause active timer
  - Resume from paused time
  - Broadcast pause state

- [ ] Timer warnings
  - Visual warning at 10 seconds remaining
  - Color change (yellow → red)
  - Optional audio alert

- [ ] Per-creature timer settings
  - Different durations for different creature types
  - Auto-start timer on turn change (optional)

**Deliverables:**
- More flexible timer system
- Better time management tools for DM

---

### 3.3 Turn History

**Priority:** Low
**Dependencies:** 2.1

**Tasks:**
- [ ] Implement turn history tracking
  - Store last N turns in state
  - Include timestamp, creature, round

- [ ] Display turn history in DM console
  - Show last 3-5 turns
  - Highlight previous turn
  - Clear on combat end

- [ ] Optional: Undo last turn
  - Rollback to previous turn
  - Revert state changes
  - Broadcast to all clients

**Deliverables:**
- DM can see recent turn history
- Helps verify turn order

---

### 3.4 System Monitoring & Diagnostics

**Priority:** Medium
**Dependencies:** All previous

**Tasks:**
- [ ] Implement health check endpoint
  - GET /health → returns server status
  - Redis connection status
  - Memory usage
  - Uptime

- [ ] Add connection monitoring
  - Track connected clients by type
  - Display in DM console
  - Show last seen time for disconnected devices

- [ ] Event logging/auditing
  - Log all events to file
  - Optional: Store in database
  - Event replay for debugging

- [ ] Performance metrics
  - Track event processing time
  - Track message latency
  - Prometheus metrics (optional)

- [ ] Admin dashboard (optional)
  - Web interface for system monitoring
  - View logs
  - View connected clients
  - Manual state editing

**Deliverables:**
- System health visibility
- Better debugging tools
- Optional admin interface

---

### 3.5 Documentation & Deployment

**Priority:** High
**Dependencies:** All features complete

**Tasks:**
- [ ] Complete user documentation
  - DM guide (how to use DM console)
  - Player guide (how to use ESP32 devices)
  - Display setup guide
  - Troubleshooting guide

- [ ] Complete technical documentation
  - API documentation (update websocket-events.md)
  - Architecture documentation (update overview.md)
  - Deployment guide (update setup-guide.md)
  - Development guide (how to contribute)

- [ ] Create installation scripts
  - One-command Raspberry Pi setup
  - Auto-configuration scripts
  - Backup/restore scripts

- [ ] Prepare release
  - Version numbering (semantic versioning)
  - Changelog
  - Release notes
  - GitHub release with binaries

- [ ] Create demo video
  - Screen recording of full workflow
  - Show all devices working together
  - Tutorial for new users

**Deliverables:**
- Complete documentation set
- Easy installation process
- Release-ready artifacts

---

### 3.6 Long-term Maintenance Preparation

**Priority:** Low
**Dependencies:** 3.5

**Tasks:**
- [ ] Setup CI/CD pipeline
  - GitHub Actions for automated testing
  - Automated Docker builds
  - Automated releases

- [ ] Dependency management
  - Dependabot for dependency updates
  - Regular security audits
  - Update schedule

- [ ] Backup strategy
  - Automated Redis backups
  - Backup to external storage
  - Restore procedure documentation

- [ ] Monitoring setup
  - Optional: Grafana dashboards
  - Optional: Alert system
  - Log aggregation

- [ ] Future enhancement planning
  - Feature backlog
  - Community feedback process
  - Roadmap for v2.0

**Deliverables:**
- Sustainable maintenance process
- Automated quality assurance
- Clear upgrade path

---

## Development Guidelines

### Code Quality Standards

**General:**
- Write clean, self-documenting code
- Follow DRY (Don't Repeat Yourself) principle
- Use meaningful variable/function names
- Add comments for complex logic

**TypeScript/JavaScript:**
- Use TypeScript for server code (type safety)
- ESLint + Prettier for consistent formatting
- Async/await over callbacks
- Proper error handling (try/catch)

**Vue.js:**
- Composition API preferred
- Single-file components
- Props validation
- TypeScript for type safety

**C++ (ESP32):**
- Follow Arduino style guide
- RAII for resource management
- Const correctness
- Minimize global state

### Testing Strategy

**Unit Tests:**
- All business logic functions
- Validation functions
- State manipulation
- Target: >70% coverage

**Integration Tests:**
- WebSocket event flows
- State synchronization
- Multi-client scenarios

**Manual Testing:**
- Hardware testing (ESP32, Pi)
- End-to-end user workflows
- Network failure scenarios
- Battery life testing

### Version Control

**Branching Strategy:**
- `main` - production-ready code
- `develop` - integration branch
- `feature/*` - feature branches
- `hotfix/*` - urgent fixes

**Commit Messages:**
- Use conventional commits format
- Example: `feat(server): add timer expiration event`
- Example: `fix(dm-console): correct turn advancement bug`

**Pull Requests:**
- All changes via PR
- Require passing tests
- Code review before merge

### Security Considerations

**Current Scope (Local Network):**
- No authentication required
- No encryption needed
- Input validation critical
- Prevent injection attacks

**Future (If Internet-Exposed):**
- Add JWT authentication
- Use WSS (WebSocket Secure)
- Implement rate limiting
- Add CSRF protection

### Performance Targets

**Latency:**
- Event propagation: <100ms
- Timer tick broadcast: <50ms
- State update: <50ms

**Throughput:**
- Support 100+ events/second
- Support 20 concurrent connections

**Resource Usage:**
- Server memory: <500MB
- ESP32 memory: <100KB
- Storage: <1GB total

**Battery Life:**
- ESP32 devices: >4 hours continuous use

---

## Risk Management

### Technical Risks

**Risk:** WebSocket connection instability on WiFi
**Mitigation:**
- Implement robust auto-reconnection
- Short heartbeat intervals
- State resync on reconnection
- Test with poor network conditions

**Risk:** ESP32 memory constraints
**Mitigation:**
- Profile memory usage early
- Use static allocation where possible
- Minimize JSON parsing overhead
- Test with max expected state size

**Risk:** Redis persistence failures
**Mitigation:**
- Enable AOF + RDB persistence
- Implement graceful degradation (in-memory only)
- Regular backup procedures
- Test recovery scenarios

**Risk:** Performance on Raspberry Pi
**Mitigation:**
- Early testing on target hardware
- Optimize hot paths
- Use lightweight libraries
- Profile CPU/memory usage

### Project Risks

**Risk:** Scope creep
**Mitigation:**
- Stick to phased approach
- MVP first, enhancements later
- Clearly define "done" for each phase

**Risk:** Hardware availability
**Mitigation:**
- Order ESP32 modules early
- Have backup hardware options
- Test with multiple ESP32 variants

**Risk:** Time estimation accuracy
**Mitigation:**
- Build MVP first to validate estimates
- Add 50% buffer to estimates
- Prioritize ruthlessly

---

## Success Criteria

### MVP Success (Phase 1)
- [ ] DM can add/remove creatures
- [ ] DM can advance turns
- [ ] Timer works and syncs across devices
- [ ] Pi display shows initiative in real-time
- [ ] <100ms latency on local network
- [ ] Runs on Raspberry Pi

### Production-Ready Success (Phase 2)
- [ ] All MVP features plus:
- [ ] Session save/restore works
- [ ] Drag-and-drop reordering works
- [ ] ESP32 devices functional
- [ ] State persists across restarts
- [ ] Graceful error handling
- [ ] 4+ hour game session without issues

### Enhancement Success (Phase 3)
- [ ] All Phase 2 features plus:
- [ ] Display content switching works
- [ ] Complete documentation
- [ ] Easy installation process
- [ ] Monitoring/diagnostics available
- [ ] Ready for long-term use

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 0: Foundation | 1-2 days | Dev environment setup |
| Phase 1: MVP | 1-2 weeks | Working demo (web only) |
| Phase 2: Production | 2-3 weeks | Full feature set + ESP32 |
| Phase 3: Enhancement | 1-2 weeks | Polish + advanced features |
| **Total** | **5-8 weeks** | **Production-ready system** |

*Note: Assumes part-time development (10-20 hours/week)*

---

## Next Steps

1. **Read and approve this plan**
   - Review scope and priorities
   - Adjust timeline if needed
   - Confirm success criteria

2. **Setup development environment** (Phase 0)
   - Create project structure
   - Initialize all projects
   - Verify local dev environment

3. **Begin MVP development** (Phase 1)
   - Start with server state management
   - Build incrementally
   - Test frequently

4. **Iterate and refine**
   - Gather feedback after each phase
   - Adjust priorities as needed
   - Document learnings

---

## Appendix: Technology Stack

### Server
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **WebSocket:** Socket.IO 4.x
- **Database:** Redis 7.x
- **Language:** TypeScript (optional)
- **Testing:** Jest

### Web Clients
- **Framework:** Vue.js 3
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **WebSocket:** socket.io-client
- **State:** Pinia or Vue Composition API
- **Testing:** Vitest

### ESP32 Firmware
- **Platform:** PlatformIO
- **Framework:** Arduino
- **UI Library:** LVGL 8.x
- **WebSocket:** ArduinoWebsockets
- **JSON:** ArduinoJson
- **Display:** TFT_eSPI or similar

### Infrastructure
- **Container:** Docker
- **Orchestration:** Docker Compose
- **Reverse Proxy:** Nginx
- **Host OS:** Raspberry Pi OS (Debian-based)
- **Persistence:** Redis RDB + AOF

### Development Tools
- **IDE:** VS Code
- **Version Control:** Git
- **Code Quality:** ESLint, Prettier
- **Testing:** Jest, Vitest
- **Docs:** Markdown

---

## Appendix: File Structure Reference

```
InitiativeTracker/
├── .git/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/                   # Documentation (current)
│   ├── architecture/
│   ├── api/
│   ├── requirements/
│   ├── user-stories/
│   ├── deployment/
│   └── implementation.md   # This file
├── server/                 # Node.js WebSocket Server
│   ├── src/
│   │   ├── index.ts       # Entry point
│   │   ├── state/         # State management
│   │   ├── events/        # Event handlers
│   │   ├── persistence/   # Redis integration
│   │   ├── timer/         # Timer logic
│   │   └── utils/         # Utilities
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── web/
│   ├── dm-console/        # DM web interface
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   ├── App.vue
│   │   │   └── main.ts
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── pi-display/        # Shared display
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
├── firmware/              # ESP32 firmware
│   ├── src/
│   │   ├── main.cpp
│   │   ├── wifi.cpp
│   │   ├── websocket.cpp
│   │   ├── ui.cpp
│   │   └── config.h
│   ├── lib/
│   ├── include/
│   └── platformio.ini
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── redis/
│       └── redis.conf
├── scripts/               # Utility scripts
│   ├── setup.sh          # Initial setup
│   ├── deploy.sh         # Deployment
│   └── backup.sh         # Backup script
├── README.md
├── LICENSE
└── .gitignore
```

---

## Conclusion

This implementation plan provides a clear path from nothing to a production-ready Initiative Tracker system. By following the phased approach:

1. **Phase 0** establishes the foundation
2. **Phase 1** delivers a working MVP quickly (web-only demo)
3. **Phase 2** completes all critical features and adds ESP32 devices
4. **Phase 3** adds polish and advanced features

Each phase builds on the previous, with clear deliverables and success criteria. The plan prioritizes:
- **Early validation** (MVP first)
- **Incremental delivery** (working software at each phase)
- **Risk mitigation** (test on target hardware early)
- **Long-term sustainability** (proper architecture, testing, documentation)

Estimated timeline: **5-8 weeks** of part-time development to reach production-ready state.

Ready to begin? Start with **Phase 0: Foundation Setup**!
