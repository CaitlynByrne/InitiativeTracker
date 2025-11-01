# Technical Requirements

## Functional Requirements

### FR-1: Initiative Order Management

**Description:** System shall maintain and display an ordered list of combatants based on initiative values.

**Requirements:**
- FR-1.1: Support adding creatures with name, initiative value, and type (Player/NPC)
- FR-1.2: Automatically sort creatures by initiative value (descending)
- FR-1.3: Support manual reordering via drag-and-drop
- FR-1.4: Support removing creatures from the order
- FR-1.5: Track current turn position in the order
- FR-1.6: Support minimum 20 creatures in initiative order
- FR-1.7: Persist initiative order across server restarts

**Priority:** P0 (Critical)
**Dependencies:** None

---

### FR-2: Turn Management

**Description:** System shall manage turn progression through the initiative order.

**Requirements:**
- FR-2.1: Advance to next creature in order on demand
- FR-2.2: Wrap to beginning of order after last creature
- FR-2.3: Increment round counter when wrapping
- FR-2.4: Highlight current turn on all displays
- FR-2.5: Indicate "on deck" (next creature) on all displays
- FR-2.6: Allow players to end their turn via device button
- FR-2.7: Validate turn-end requests (only current player can end turn)

**Priority:** P0 (Critical)
**Dependencies:** FR-1

---

### FR-3: Timer Management

**Description:** System shall support countdown timers for turns.

**Requirements:**
- FR-3.1: Start timer with configurable duration (seconds)
- FR-3.2: Display timer on all connected devices
- FR-3.3: Update timer display every second
- FR-3.4: Trigger alert/notification when timer expires
- FR-3.5: Allow stopping/canceling active timer
- FR-3.6: Support multiple preset durations (30s, 60s, 90s, 120s)
- FR-3.7: Timer precision within ±200ms

**Priority:** P0 (Critical)
**Dependencies:** FR-2

---

### FR-4: Session Persistence

**Description:** System shall save and restore game session state.

**Requirements:**
- FR-4.1: Save current initiative order, turn position, and round
- FR-4.2: Support named save sessions
- FR-4.3: Store save timestamp and metadata
- FR-4.4: List all saved sessions with names and timestamps
- FR-4.5: Restore saved session on demand
- FR-4.6: Auto-save current state periodically (every 30 seconds)
- FR-4.7: Persist state across server restarts
- FR-4.8: Support minimum 20 saved sessions

**Priority:** P1 (High)
**Dependencies:** FR-1, FR-2

---

### FR-5: Multi-Device Synchronization

**Description:** System shall synchronize state across all connected devices in real-time.

**Requirements:**
- FR-5.1: Broadcast state changes to all clients within 100ms
- FR-5.2: Support DM console connections (web browser)
- FR-5.3: Support Pi display connections (web browser)
- FR-5.4: Support ESP32 player device connections
- FR-5.5: Handle client disconnections gracefully
- FR-5.6: Auto-reconnect clients on network recovery
- FR-5.7: Resynchronize state on client reconnection
- FR-5.8: Support minimum 15 concurrent connections

**Priority:** P0 (Critical)
**Dependencies:** All functional requirements

---

### FR-6: Display Content Control

**Description:** System shall support displaying custom content on shared display.

**Requirements:**
- FR-6.1: Switch display between initiative view and content view
- FR-6.2: Display images (JPG, PNG) on command
- FR-6.3: Display condition descriptions (text content)
- FR-6.4: Scale images to fit display without distortion
- FR-6.5: Return to initiative view on command
- FR-6.6: Content appears within 1 second of command

**Priority:** P2 (Medium)
**Dependencies:** FR-5

---

### FR-7: Player Device UI

**Description:** ESP32 player devices shall display turn status and allow turn control.

**Requirements:**
- FR-7.1: Display player's current turn status (active/on-deck/waiting)
- FR-7.2: Display player's position in initiative order
- FR-7.3: Display active timer countdown
- FR-7.4: Provide "End Turn" button (active only during player's turn)
- FR-7.5: Provide connection status indicator
- FR-7.6: Support three display sizes (240x135, 320x240, 480x320)
- FR-7.7: Wake/brighten display when player's turn starts
- FR-7.8: Dim display when not player's turn

**Priority:** P0 (Critical)
**Dependencies:** FR-2, FR-3, FR-5

---

### FR-8: DM Console UI

**Description:** Web-based DM console shall provide full control interface.

**Requirements:**
- FR-8.1: Display full initiative order with current turn highlighted
- FR-8.2: Provide creature add/remove controls
- FR-8.3: Provide drag-and-drop reordering
- FR-8.4: Provide next turn button
- FR-8.5: Provide timer controls (start/stop, duration selection)
- FR-8.6: Provide session save/restore controls
- FR-8.7: Display connection status
- FR-8.8: Responsive design for tablet and laptop screens
- FR-8.9: Touch-friendly controls for tablets

**Priority:** P0 (Critical)
**Dependencies:** FR-1, FR-2, FR-3, FR-4, FR-5

---

### FR-9: Shared Display UI

**Description:** Pi-powered shared display shall show initiative order to all players.

**Requirements:**
- FR-9.1: Display full initiative order
- FR-9.2: Highlight current turn prominently
- FR-9.3: Indicate on-deck creature
- FR-9.4: Display active timer countdown
- FR-9.5: Display round number
- FR-9.6: Readable from 6-8 feet distance
- FR-9.7: Support multiple display resolutions (720p, 1080p, 4K)
- FR-9.8: Auto-start on Pi boot without user interaction

**Priority:** P0 (Critical)
**Dependencies:** FR-1, FR-2, FR-3, FR-5

---

## Non-Functional Requirements

### NFR-1: Performance

**Requirements:**
- NFR-1.1: Server shall handle 20 concurrent WebSocket connections
- NFR-1.2: State change latency <100ms end-to-end on local network
- NFR-1.3: Server event processing time <50ms
- NFR-1.4: Timer tick updates delivered within ±200ms
- NFR-1.5: Web UI shall render at 60fps for animations
- NFR-1.6: ESP32 UI shall render at 30fps minimum
- NFR-1.7: Page load time <3 seconds for web clients
- NFR-1.8: ESP32 boot to connected <10 seconds

**Priority:** P1 (High)

---

### NFR-2: Scalability

**Requirements:**
- NFR-2.1: Support 100 creatures in initiative order
- NFR-2.2: Support 50 saved sessions
- NFR-2.3: Session data size <10MB per session
- NFR-2.4: Total system RAM usage <500MB
- NFR-2.5: Server CPU usage <50% under normal load

**Priority:** P2 (Medium)

---

### NFR-3: Reliability

**Requirements:**
- NFR-3.1: System uptime >99% during game session (4 hours)
- NFR-3.2: Automatic client reconnection within 5 seconds
- NFR-3.3: State preserved across server restart
- NFR-3.4: No data loss on graceful shutdown
- NFR-3.5: Graceful degradation with partial client failures
- NFR-3.6: Server continues operating if Redis temporarily unavailable

**Priority:** P1 (High)

---

### NFR-4: Usability

**Requirements:**
- NFR-4.1: DM console operable with zero training
- NFR-4.2: Player devices operable with zero training
- NFR-4.3: Shared display requires zero configuration after initial setup
- NFR-4.4: Touch targets minimum 44x44 pixels (WCAG guideline)
- NFR-4.5: Text contrast ratio >4.5:1 (WCAG AA)
- NFR-4.6: Critical actions require confirmation
- NFR-4.7: Error messages shall be clear and actionable

**Priority:** P1 (High)

---

### NFR-5: Portability

**Requirements:**
- NFR-5.1: Server runs on Raspberry Pi 3B or newer
- NFR-5.2: DM console works on Chrome, Firefox, Safari, Edge (latest)
- NFR-5.3: DM console works on Windows, Mac, Linux, iOS, Android
- NFR-5.4: Shared display works on any HDMI display
- NFR-5.5: ESP32 firmware works on standard ESP32 modules
- NFR-5.6: System operates on standard 802.11n WiFi

**Priority:** P1 (High)

---

### NFR-6: Maintainability

**Requirements:**
- NFR-6.1: Code shall be documented with inline comments
- NFR-6.2: Architecture shall be documented (separate docs)
- NFR-6.3: API/events shall be documented
- NFR-6.4: Deployment procedure shall be documented
- NFR-6.5: Modular architecture with clear separation of concerns
- NFR-6.6: Configuration via environment variables
- NFR-6.7: Logging for all critical operations

**Priority:** P2 (Medium)

---

### NFR-7: Security

**Requirements:**
- NFR-7.1: System operates on trusted local network only
- NFR-7.2: No authentication required (local network trust)
- NFR-7.3: Input validation on all server endpoints
- NFR-7.4: No sensitive data storage (no PII)
- NFR-7.5: Services not exposed to internet
- NFR-7.6: Documentation warns against internet exposure

**Priority:** P1 (High)

---

### NFR-8: Resource Constraints

**Requirements:**
- NFR-8.1: Server runs on Raspberry Pi with 1GB RAM minimum
- NFR-8.2: ESP32 firmware uses <100KB RAM
- NFR-8.3: ESP32 firmware fits in <1.5MB flash
- NFR-8.4: Storage requirement <1GB for system
- NFR-8.5: Network bandwidth <1Mbps typical usage
- NFR-8.6: ESP32 battery life >4 hours with 500mAh battery

**Priority:** P1 (High)

---

### NFR-9: Deployment

**Requirements:**
- NFR-9.1: Server deployment via Docker Compose
- NFR-9.2: Server auto-starts on Pi boot
- NFR-9.3: Shared display auto-starts on Pi boot
- NFR-9.4: Setup time <30 minutes for complete system
- NFR-9.5: Zero-downtime updates (optional)
- NFR-9.6: Rollback capability for failed updates

**Priority:** P1 (High)

---

### NFR-10: Network

**Requirements:**
- NFR-10.1: Operates on local network without internet
- NFR-10.2: Server accessible via static IP or mDNS hostname
- NFR-10.3: WiFi signal strength minimum -75 dBm
- NFR-10.4: Network latency <50ms between devices
- NFR-10.5: Supports 2.4GHz and 5GHz WiFi
- NFR-10.6: WebSocket connection stable for 4+ hour sessions

**Priority:** P1 (High)

---

## Data Requirements

### DR-1: State Data Model

**Structure:**
```json
{
  "session_id": "string (UUID or timestamp)",
  "current_turn_index": "integer (0-based)",
  "round": "integer (starts at 1)",
  "timer": {
    "active": "boolean",
    "remaining": "integer (seconds)",
    "duration": "integer (seconds)"
  },
  "initiative_order": [
    {
      "id": "string (UUID)",
      "name": "string (max 50 chars)",
      "initiative": "integer (1-99)",
      "type": "string ('player' or 'npc')",
      "device_id": "string (optional, ESP32 identifier)"
    }
  ],
  "metadata": {
    "created_at": "ISO 8601 timestamp",
    "last_modified": "ISO 8601 timestamp",
    "save_name": "string (optional, user-provided)"
  }
}
```

**Validation Rules:**
- session_id: Required, unique
- current_turn_index: 0 <= value < length(initiative_order)
- round: >= 1
- timer.remaining: 0 <= value <= timer.duration
- timer.duration: 1-600 seconds (10 minutes max)
- creature.name: 1-50 characters, printable only
- creature.initiative: 1-99 (standard D&D range)
- creature.type: Enum ['player', 'npc']

**Size Constraints:**
- Max creatures in order: 100
- Max saved sessions: 50
- Max session size: 10MB

---

### DR-2: Message Data Model

**WebSocket Event Format:**
```json
{
  "event": "string (event name)",
  "data": "object (event-specific payload)",
  "timestamp": "ISO 8601 timestamp (optional)"
}
```

**Event-Specific Schemas:** See [websocket-events.md](../api/websocket-events.md)

---

### DR-3: Persistence Requirements

**Redis Storage:**
- Key: `initiative:state` (current active state)
- Key: `initiative:saved:{name}` (saved sessions)
- TTL: None (persist indefinitely)
- Persistence: RDB + AOF enabled

**File System:**
- Backup directory: `/data/backups/`
- Format: JSON files
- Naming: `session_{timestamp}.json`
- Retention: Manual cleanup (no automatic deletion)

---

## Interface Requirements

### IR-1: WebSocket Interface

**Protocol:** WebSocket (RFC 6455) via Socket.IO
**Encoding:** JSON (UTF-8)
**Connection:** Persistent, bidirectional
**Port:** 80 (via Nginx proxy to 3000)

**Client Types:**
- DM Console: Type 'dm'
- Pi Display: Type 'pi'
- ESP32 Player: Type 'player' with device_id

**Connection Flow:**
1. Client connects to `/socket.io/`
2. Client sends 'identify' event with type and device_id
3. Server responds with full state
4. Client subscribes to relevant events
5. Bidirectional event exchange begins

---

### IR-2: HTTP Interface (Minimal)

**Purpose:** Static file serving only

**Endpoints:**
- `GET /` - DM Console HTML
- `GET /pi-display.html` - Pi Display HTML
- `GET /assets/*` - Static assets (CSS, JS, images)

**Note:** All dynamic communication via WebSocket, not REST

---

### IR-3: ESP32 WiFi Interface

**Protocol:** 802.11n (2.4GHz)
**Security:** WPA2-PSK
**DHCP:** Client mode
**DNS:** Use server IP or mDNS (raspberrypi.local)

**Configuration:**
- WiFi credentials hardcoded in firmware
- Or configured via WiFiManager library
- Server address hardcoded or configurable

---

## Testing Requirements

### TR-1: Unit Testing

**Requirements:**
- Server business logic unit tests (Jest)
- Minimum 70% code coverage for server
- Test all state management functions
- Test all validation functions
- Automated execution in CI/CD

**Priority:** P2 (Medium)

---

### TR-2: Integration Testing

**Requirements:**
- WebSocket message flow tests
- State synchronization tests
- Save/restore functionality tests
- Timer accuracy tests
- Multi-client coordination tests

**Priority:** P1 (High)

---

### TR-3: Manual Testing

**Requirements:**
- Test checklist for all user stories
- Multi-device test scenarios
- Network interruption recovery tests
- Battery life tests for ESP32
- Display readability tests

**Priority:** P1 (High)

---

## Constraints

### Technical Constraints

- TC-1: Must use WebSocket for real-time communication
- TC-2: Must run on Raspberry Pi hardware
- TC-3: Must support ESP32 resource limitations
- TC-4: Must work without internet connection
- TC-5: Must use standard WiFi (no custom protocols)

### Business Constraints

- BC-1: Personal/hobby project (no budget for cloud services)
- BC-2: Use open-source software only
- BC-3: No user accounts or authentication
- BC-4: Local network only (no WAN/internet)

### Environmental Constraints

- EC-1: Operates in typical home/game store environment
- EC-2: WiFi may have interference from other devices
- EC-3: Power may be limited (battery-powered ESP32s)
- EC-4: Lighting conditions vary (affects display readability)

---

## Assumptions

- A-1: All devices on same trusted local network
- A-2: DM has technical skills to set up Raspberry Pi
- A-3: Game sessions last 3-5 hours maximum
- A-4: Maximum 12 players at one table
- A-5: WiFi signal reaches all table locations
- A-6: Devices are physically secured (no theft concerns)
- A-7: Players will charge ESP32 devices between sessions
