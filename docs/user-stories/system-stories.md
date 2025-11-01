# System Stories

## Deployment & Infrastructure

### [SYS-1] Deploy via Docker Compose

**As a** System Administrator
**I want** to deploy all services via Docker Compose
**So that** setup is repeatable and consistent

**Acceptance Criteria:**
- [ ] Single docker-compose.yml defines all services
- [ ] WebSocket server container configured
- [ ] Redis container configured with persistence
- [ ] Web server (Nginx) container configured
- [ ] All services start with `docker-compose up -d`
- [ ] Services restart on failure
- [ ] Data persists across container restarts

**Priority:** High
**Complexity:** Medium
**Dependencies:** None

---

### [SYS-2] Auto-Start on Raspberry Pi Boot

**As a** DM
**I want** the server to start automatically when Pi boots
**So that** I don't need to manually start services

**Acceptance Criteria:**
- [ ] systemd service configured for Docker Compose
- [ ] Service enabled for auto-start
- [ ] Services start in correct order (dependencies)
- [ ] Logs available via journalctl
- [ ] Can manually stop/start/restart service

**Priority:** High
**Complexity:** Low
**Dependencies:** SYS-1

---

### [SYS-3] Minimal Hardware Requirements

**As a** DM
**I want** the system to run on low-power Raspberry Pi
**So that** I don't need expensive server hardware

**Acceptance Criteria:**
- [ ] Runs on Raspberry Pi 3B or newer
- [ ] RAM usage <500MB total
- [ ] CPU usage <50% under normal load
- [ ] Works with 16GB SD card (8GB minimum)
- [ ] No active cooling required

**Priority:** High
**Complexity:** Low
**Dependencies:** SYS-1

---

### [SYS-4] Network Configuration

**As a** System Administrator
**I want** simple network configuration
**So that** setup is straightforward

**Acceptance Criteria:**
- [ ] Server Pi has static IP or predictable hostname
- [ ] mDNS/Avahi configured (raspberrypi.local)
- [ ] Required ports open in firewall
- [ ] Works on isolated LAN (no internet required)
- [ ] Documentation for network setup

**Priority:** High
**Complexity:** Medium
**Dependencies:** None

---

## Reliability & Fault Tolerance

### [SYS-5] Handle WebSocket Disconnections

**As a** User
**I want** the system to handle network interruptions gracefully
**So that** temporary WiFi issues don't break the game

**Acceptance Criteria:**
- [ ] Clients automatically reconnect when disconnected
- [ ] Exponential backoff for reconnection attempts
- [ ] State resynchronizes on reconnection
- [ ] No data loss during brief disconnections
- [ ] User notified of connection status

**Priority:** High
**Complexity:** Medium
**Dependencies:** None

---

### [SYS-6] State Persistence Across Restarts

**As a** DM
**I want** the active session to survive server restarts
**So that** I don't lose progress if the server crashes or reboots

**Acceptance Criteria:**
- [ ] State saved to Redis continuously
- [ ] State loaded from Redis on server startup
- [ ] Redis persistence enabled (RDB + AOF)
- [ ] Last state restored within 5 seconds of restart
- [ ] Clients reconnect and sync automatically

**Priority:** High
**Complexity:** Medium
**Dependencies:** SYS-1

---

### [SYS-7] Graceful Degradation

**As a** User
**I want** the system to continue working with partial failures
**So that** one broken component doesn't stop the game

**Acceptance Criteria:**
- [ ] DM console works if some players disconnected
- [ ] Players can still see state if display disconnected
- [ ] Server continues if Redis temporarily unavailable
- [ ] Read-only mode if persistence fails
- [ ] Clear error messages for failures

**Priority:** Medium
**Complexity:** High
**Dependencies:** None

---

### [SYS-8] Data Backup and Recovery

**As a** DM
**I want** saved sessions backed up
**So that** I don't lose campaign data

**Acceptance Criteria:**
- [ ] Redis data directory backed up to separate location
- [ ] Daily automated backups (optional)
- [ ] Can manually trigger backup
- [ ] Can restore from backup
- [ ] Backup includes all saved sessions

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** SYS-6

---

## Performance

### [SYS-9] Low Latency State Propagation

**As a** User
**I want** changes to appear instantly on all devices
**So that** the system feels responsive

**Acceptance Criteria:**
- [ ] <50ms server processing time for events
- [ ] <100ms end-to-end latency on local network
- [ ] WebSocket messages delivered immediately
- [ ] No perceptible lag between devices
- [ ] Timer ticks synchronized across clients

**Priority:** High
**Complexity:** Medium
**Dependencies:** None

---

### [SYS-10] Support Multiple Concurrent Clients

**As a** System
**I want** to handle 15+ concurrent connections
**So that** large game groups can use the system

**Acceptance Criteria:**
- [ ] Server supports 20+ WebSocket connections
- [ ] Performance doesn't degrade with more clients
- [ ] Each client receives all relevant updates
- [ ] No connection limits hit under normal use
- [ ] Load testing validates capacity

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [SYS-11] Efficient ESP32 Resource Usage

**As a** System
**I want** ESP32 firmware to use minimal resources
**So that** devices run smoothly and battery lasts

**Acceptance Criteria:**
- [ ] Firmware uses <100KB RAM
- [ ] Firmware fits in <1MB flash
- [ ] WiFi power management enabled
- [ ] Display updates don't cause frame drops
- [ ] Works on ESP32 without PSRAM (if possible)

**Priority:** High
**Complexity:** High
**Dependencies:** None

---

## Security

### [SYS-12] Local Network Only

**As a** Security Consideration
**I want** the system to only work on local network
**So that** it's not exposed to internet threats

**Acceptance Criteria:**
- [ ] No external internet access required
- [ ] Services bound to local network interface only
- [ ] Documentation warns against internet exposure
- [ ] Firewall rules prevent external access
- [ ] No authentication required (trusted network)

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

### [SYS-13] Input Validation

**As a** System
**I want** all input validated and sanitized
**So that** malformed data doesn't crash the server

**Acceptance Criteria:**
- [ ] WebSocket events validated against schema
- [ ] Numeric values checked for valid ranges
- [ ] String inputs sanitized (length limits)
- [ ] Invalid events logged and rejected
- [ ] Server continues operating after invalid input

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** None

---

## Monitoring & Debugging

### [SYS-14] Server Logging

**As a** System Administrator
**I want** comprehensive server logs
**So that** I can debug issues

**Acceptance Criteria:**
- [ ] Connection events logged (connect/disconnect)
- [ ] State changes logged with timestamp
- [ ] Errors logged with stack traces
- [ ] Logs written to file and stdout
- [ ] Log rotation configured
- [ ] Configurable log level (debug/info/warn/error)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [SYS-15] Client-Side Error Reporting

**As a** Developer
**I want** client errors reported to console
**So that** I can troubleshoot client issues

**Acceptance Criteria:**
- [ ] JavaScript errors logged to browser console
- [ ] WebSocket errors logged
- [ ] State sync issues logged
- [ ] ESP32 errors logged to serial console
- [ ] Error context included (timestamp, state)

**Priority:** Low
**Complexity:** Low
**Dependencies:** None

---

### [SYS-16] Health Check Endpoint

**As a** System Administrator
**I want** a health check endpoint
**So that** I can monitor system status

**Acceptance Criteria:**
- [ ] HTTP endpoint returns 200 when healthy
- [ ] Checks WebSocket server status
- [ ] Checks Redis connectivity
- [ ] Returns JSON with component status
- [ ] Accessible at /health or /status

**Priority:** Low
**Complexity:** Low
**Dependencies:** SYS-1

---

## Maintenance & Updates

### [SYS-17] Easy Updates

**As a** System Administrator
**I want** to update the system easily
**So that** I can deploy bug fixes and new features

**Acceptance Criteria:**
- [ ] Can update with `git pull && docker-compose up -d --build`
- [ ] Database migrations handled automatically (if needed)
- [ ] Rolling updates minimize downtime
- [ ] Rollback procedure documented
- [ ] Version number visible in UI and logs

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** SYS-1

---

### [SYS-18] ESP32 Firmware Updates

**As a** System Administrator
**I want** a way to update ESP32 firmware
**So that** I can deploy improvements to player devices

**Acceptance Criteria:**
- [ ] OTA (Over-The-Air) updates supported
- [ ] Or: Easy USB flashing procedure documented
- [ ] Version number visible on ESP32 display
- [ ] Firmware update doesn't erase configuration
- [ ] Update procedure documented

**Priority:** Low
**Complexity:** High
**Dependencies:** None

---

## Configuration

### [SYS-19] Environment-Based Configuration

**As a** System Administrator
**I want** configuration via environment variables
**So that** I can customize deployment without code changes

**Acceptance Criteria:**
- [ ] Server port configurable via env var
- [ ] Redis connection configurable via env var
- [ ] WiFi SSID/password for ESP32 configurable
- [ ] Default timer duration configurable
- [ ] .env file support for local development

**Priority:** Medium
**Complexity:** Low
**Dependencies:** SYS-1

---

### [SYS-20] Sensible Defaults

**As a** User
**I want** the system to work out-of-the-box
**So that** I don't need extensive configuration

**Acceptance Criteria:**
- [ ] Default configuration works for typical use case
- [ ] No required configuration for basic functionality
- [ ] Configuration only needed for customization
- [ ] Defaults documented in README

**Priority:** High
**Complexity:** Low
**Dependencies:** SYS-19

---

## Testing

### [SYS-21] Integration Tests

**As a** Developer
**I want** integration tests for critical paths
**So that** I can verify system behavior

**Acceptance Criteria:**
- [ ] Tests for initiative order management
- [ ] Tests for turn advancement
- [ ] Tests for timer functionality
- [ ] Tests for save/restore
- [ ] Tests for WebSocket message flow
- [ ] Tests run in CI/CD pipeline

**Priority:** Medium
**Complexity:** High
**Dependencies:** None

---

### [SYS-22] Manual Test Procedures

**As a** Developer
**I want** documented manual test procedures
**So that** I can verify functionality before releases

**Acceptance Criteria:**
- [ ] Test checklist for all major features
- [ ] Instructions for setting up test environment
- [ ] Expected behavior documented
- [ ] Edge cases covered
- [ ] Multi-device test scenarios

**Priority:** Low
**Complexity:** Low
**Dependencies:** None

---

## Documentation

### [SYS-23] Setup Guide

**As a** New User
**I want** a comprehensive setup guide
**So that** I can get the system running

**Acceptance Criteria:**
- [ ] Hardware requirements listed
- [ ] Software installation steps
- [ ] Network configuration instructions
- [ ] ESP32 flashing instructions
- [ ] Troubleshooting section
- [ ] Screenshots/diagrams included

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

### [SYS-24] API Documentation

**As a** Developer
**I want** WebSocket event documentation
**So that** I can understand the protocol

**Acceptance Criteria:**
- [ ] All events documented
- [ ] Event payload schemas defined
- [ ] Client-to-server events listed
- [ ] Server-to-client events listed
- [ ] Examples provided
- [ ] Keep in sync with implementation

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [SYS-25] Architecture Documentation

**As a** Developer
**I want** architecture documentation
**So that** I can understand system design

**Acceptance Criteria:**
- [ ] Component diagram
- [ ] Data flow diagrams
- [ ] Technology stack documented
- [ ] Design decisions explained
- [ ] Deployment architecture documented
- [ ] This documentation! (already done)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None
