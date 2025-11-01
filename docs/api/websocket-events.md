# WebSocket Events API

## Overview

This document defines all WebSocket events used in the Initiative Tracker system. All events use Socket.IO over WebSocket with JSON payloads.

## Connection Protocol

### Client Connection Flow

```
1. Client connects to WebSocket server
2. Server accepts connection (Socket.IO handshake)
3. Client emits 'identify' event with client type and ID
4. Server responds with 'state:update' containing full current state
5. Bidirectional event communication begins
```

### Event Message Format

All events follow this structure:

```javascript
{
  event: "event_name",
  data: { /* event-specific payload */ }
}
```

**Note:** With Socket.IO, events are emitted with the event name as the first parameter and data as the second parameter:

```javascript
// Sending
socket.emit('event_name', { /* data */ });

// Receiving
socket.on('event_name', (data) => { /* handle */ });
```

---

## Client Identification

### Event: `identify`

**Direction:** Client → Server
**Purpose:** Client identifies itself to the server
**When:** Immediately after WebSocket connection established

**Payload:**
```typescript
{
  type: 'dm' | 'pi' | 'player',
  device_id?: string  // Required for type='player', optional otherwise
}
```

**Examples:**

```javascript
// DM Console
socket.emit('identify', { type: 'dm' });

// Pi Display
socket.emit('identify', { type: 'pi' });

// ESP32 Player Device
socket.emit('identify', {
  type: 'player',
  device_id: 'esp32_001'
});
```

**Server Response:**
Server immediately sends `state:update` with full current state.

---

## State Synchronization

### Event: `state:update`

**Direction:** Server → All Clients
**Purpose:** Broadcast complete current state
**When:**
- On client identification
- After any state change
- On request via `state:request`

**Payload:**
```typescript
{
  session_id: string,
  current_turn_index: number,
  round: number,
  timer: {
    active: boolean,
    remaining: number,    // seconds
    duration: number      // seconds
  },
  initiative_order: Array<{
    id: string,
    name: string,
    initiative: number,
    type: 'player' | 'npc',
    device_id?: string    // Present if type='player'
  }>,
  metadata: {
    created_at: string,   // ISO 8601
    last_modified: string // ISO 8601
  }
}
```

**Example:**
```json
{
  "session_id": "session_2024_11_01_001",
  "current_turn_index": 0,
  "round": 1,
  "timer": {
    "active": true,
    "remaining": 42,
    "duration": 60
  },
  "initiative_order": [
    {
      "id": "creature_001",
      "name": "Paladin",
      "initiative": 23,
      "type": "player",
      "device_id": "esp32_001"
    },
    {
      "id": "creature_002",
      "name": "Goblin",
      "initiative": 18,
      "type": "npc"
    }
  ],
  "metadata": {
    "created_at": "2024-11-01T19:30:00Z",
    "last_modified": "2024-11-01T19:35:42Z"
  }
}
```

---

### Event: `state:request`

**Direction:** Client → Server
**Purpose:** Request full state resync
**When:** After reconnection or if client suspects state drift

**Payload:** None (empty object)

**Example:**
```javascript
socket.emit('state:request');
```

**Server Response:** `state:update` with full state

---

## Initiative Management

### Event: `initiative:reorder`

**Direction:** Client → Server
**Purpose:** Reorder initiative list (DM drag-and-drop)
**When:** DM drags creature to new position

**Payload:**
```typescript
Array<{
  id: string,
  name: string,
  initiative: number,
  type: 'player' | 'npc',
  device_id?: string
}>
```

**Example:**
```json
[
  { "id": "creature_002", "name": "Goblin", "initiative": 18, "type": "npc" },
  { "id": "creature_001", "name": "Paladin", "initiative": 23, "type": "player", "device_id": "esp32_001" }
]
```

**Server Response:** `state:update` to all clients

**Validation:**
- Array must contain same IDs as current state
- No duplicates allowed

---

### Event: `creature:add`

**Direction:** Client → Server
**Purpose:** Add new creature to initiative
**When:** DM adds creature via form

**Payload:**
```typescript
{
  name: string,           // 1-50 characters
  initiative: number,     // 1-99
  type: 'player' | 'npc',
  device_id?: string      // Optional, for player creatures
}
```

**Example:**
```json
{
  "name": "Wizard",
  "initiative": 15,
  "type": "player",
  "device_id": "esp32_002"
}
```

**Server Response:**
- Generates unique ID
- Inserts in sorted position
- Broadcasts `state:update`

**Validation:**
- Name: 1-50 printable characters
- Initiative: 1-99
- Type: Must be 'player' or 'npc'
- device_id: Optional, alphanumeric

---

### Event: `creature:remove`

**Direction:** Client → Server
**Purpose:** Remove creature from initiative
**When:** DM clicks remove button

**Payload:**
```typescript
{
  id: string  // Creature ID to remove
}
```

**Example:**
```json
{
  "id": "creature_002"
}
```

**Server Response:**
- Removes creature from order
- Adjusts current_turn_index if needed
- Broadcasts `state:update`

**Validation:**
- ID must exist in initiative_order

---

## Turn Management

### Event: `turn:next`

**Direction:** Client → Server
**Purpose:** Advance to next turn
**When:** DM clicks "Next Turn" button

**Payload:** None (empty object)

**Example:**
```javascript
socket.emit('turn:next');
```

**Server Behavior:**
- Increments current_turn_index
- Wraps to 0 if at end of list
- Increments round if wrapped
- Stops active timer (optional behavior)
- Broadcasts `state:update`
- Sends targeted `player:status` updates

**Server Response:**
- `state:update` to all clients
- `player:status` to affected players

---

### Event: `turn:end`

**Direction:** Client → Server
**Purpose:** Player signals turn complete
**When:** Player taps "End Turn" on ESP32

**Payload:**
```typescript
{
  device_id: string  // Device identifier
}
```

**Example:**
```json
{
  "device_id": "esp32_001"
}
```

**Server Behavior:**
- Validates device_id matches current turn
- If valid, same as `turn:next`
- If invalid, ignores request (logs warning)

**Validation:**
- Must be current player's turn
- device_id must match current creature's device_id

---

### Event: `turn:changed`

**Direction:** Server → All Clients
**Purpose:** Notify that turn has changed (supplemental to state:update)
**When:** After turn advancement

**Payload:**
```typescript
{
  current: {
    id: string,
    name: string,
    type: 'player' | 'npc'
  },
  on_deck: {
    id: string,
    name: string,
    type: 'player' | 'npc'
  } | null,
  round: number
}
```

**Example:**
```json
{
  "current": {
    "id": "creature_003",
    "name": "Wizard",
    "type": "player"
  },
  "on_deck": {
    "id": "creature_004",
    "name": "Rogue",
    "type": "player"
  },
  "round": 2
}
```

**Note:** This is an optional supplemental event. Clients can determine turn changes from `state:update` alone.

---

## Timer Management

### Event: `timer:start`

**Direction:** Client → Server
**Purpose:** Start countdown timer
**When:** DM clicks "Start Timer" with duration

**Payload:**
```typescript
{
  duration: number  // Seconds, 1-600 (10 minutes max)
}
```

**Example:**
```json
{
  "duration": 60
}
```

**Server Behavior:**
- Sets timer.active = true
- Sets timer.remaining = duration
- Sets timer.duration = duration
- Starts internal interval (1000ms)
- Broadcasts `state:update`

**Validation:**
- Duration: 1-600 seconds

---

### Event: `timer:stop`

**Direction:** Client → Server
**Purpose:** Stop active timer
**When:** DM clicks "Stop Timer"

**Payload:** None (empty object)

**Example:**
```javascript
socket.emit('timer:stop');
```

**Server Behavior:**
- Clears internal interval
- Sets timer.active = false
- Broadcasts `state:update`

---

### Event: `timer:tick`

**Direction:** Server → All Clients
**Purpose:** Update timer countdown
**When:** Every second while timer is active

**Payload:**
```typescript
{
  remaining: number,  // Seconds remaining
  duration: number    // Original duration
}
```

**Example:**
```json
{
  "remaining": 42,
  "duration": 60
}
```

**Note:** Clients also receive full timer state in `state:update`, but `timer:tick` provides high-frequency updates.

---

### Event: `timer:expired`

**Direction:** Server → All Clients
**Purpose:** Notify that timer reached zero
**When:** Timer countdown reaches 0

**Payload:**
```typescript
{
  message: string  // Optional message
}
```

**Example:**
```json
{
  "message": "Time's up!"
}
```

**Server Behavior:**
- Stops timer (active = false)
- Sends `timer:expired`
- Broadcasts `state:update`

---

## Player-Specific Events

### Event: `player:status`

**Direction:** Server → Specific Player Client
**Purpose:** Send targeted status to individual player
**When:** Turn changes, state updates

**Payload:**
```typescript
{
  is_current: boolean,    // Is it this player's turn?
  is_on_deck: boolean,    // Is this player next?
  position: number,       // Position in initiative (1-based)
  timer: {
    active: boolean,
    remaining: number
  }
}
```

**Example:**
```json
{
  "is_current": true,
  "is_on_deck": false,
  "position": 1,
  "timer": {
    "active": true,
    "remaining": 42
  }
}
```

**Targeting:** Sent only to specific ESP32 via room/device_id

---

## Display Content Events

### Event: `display:show_content`

**Direction:** Client → Server
**Purpose:** Show custom content on Pi display
**When:** DM clicks "Show Image" or "Show Condition"

**Payload:**
```typescript
{
  type: 'image' | 'condition' | 'map',
  url?: string,           // For images/maps
  name?: string,          // For conditions
  description?: string    // For conditions
}
```

**Examples:**

```json
// Show image
{
  "type": "image",
  "url": "/assets/images/goblin.png"
}

// Show condition
{
  "type": "condition",
  "name": "Poisoned",
  "description": "A poisoned creature has disadvantage on attack rolls and ability checks."
}
```

**Server Response:** Forwards to Pi display clients via `display:content`

---

### Event: `display:content`

**Direction:** Server → Pi Display Clients
**Purpose:** Display content on shared display
**When:** Server receives `display:show_content`

**Payload:**
Same as `display:show_content`

**Example:**
```json
{
  "type": "image",
  "url": "/assets/images/dragon.jpg"
}
```

---

### Event: `display:show_initiative`

**Direction:** Client → Server
**Purpose:** Return Pi display to initiative view
**When:** DM clicks "Back to Initiative"

**Payload:** None (empty object)

**Server Response:** Sends `display:mode` to Pi displays

---

### Event: `display:mode`

**Direction:** Server → Pi Display Clients
**Purpose:** Set display mode
**When:** Content shown or dismissed

**Payload:**
```typescript
{
  mode: 'initiative' | 'content'
}
```

**Example:**
```json
{
  "mode": "initiative"
}
```

---

## Session Management

### Event: `state:save`

**Direction:** Client → Server
**Purpose:** Save current session
**When:** DM clicks "Save Session"

**Payload:**
```typescript
{
  name: string  // User-provided save name
}
```

**Example:**
```json
{
  "name": "Dragon Battle - Night 1"
}
```

**Server Behavior:**
- Saves current state to Redis with key `initiative:saved:{name}`
- Sends confirmation

**Validation:**
- Name: 1-100 characters, alphanumeric + spaces/hyphens

---

### Event: `state:saved`

**Direction:** Server → Client (who requested save)
**Purpose:** Confirm save successful
**When:** After successful save

**Payload:**
```typescript
{
  name: string,
  timestamp: string  // ISO 8601
}
```

**Example:**
```json
{
  "name": "Dragon Battle - Night 1",
  "timestamp": "2024-11-01T20:15:30Z"
}
```

---

### Event: `state:restore`

**Direction:** Client → Server
**Purpose:** Load saved session
**When:** DM selects saved session to restore

**Payload:**
```typescript
{
  name: string  // Save name to restore
}
```

**Example:**
```json
{
  "name": "Dragon Battle - Night 1"
}
```

**Server Behavior:**
- Loads state from Redis key `initiative:saved:{name}`
- Replaces current state
- Broadcasts `state:update` to all clients

**Error Response:** If save not found, sends `error` event

---

### Event: `state:list_saves`

**Direction:** Client → Server
**Purpose:** Request list of saved sessions
**When:** DM opens restore dialog

**Payload:** None (empty object)

**Server Response:** `state:saves_list`

---

### Event: `state:saves_list`

**Direction:** Server → Client
**Purpose:** Provide list of saved sessions
**When:** Response to `state:list_saves`

**Payload:**
```typescript
{
  saves: Array<{
    name: string,
    timestamp: string,  // ISO 8601
    creature_count: number,
    round: number
  }>
}
```

**Example:**
```json
{
  "saves": [
    {
      "name": "Dragon Battle - Night 1",
      "timestamp": "2024-11-01T20:15:30Z",
      "creature_count": 8,
      "round": 3
    },
    {
      "name": "Goblin Ambush",
      "timestamp": "2024-10-28T18:00:00Z",
      "creature_count": 12,
      "round": 1
    }
  ]
}
```

---

### Event: `session:clear`

**Direction:** Client → Server
**Purpose:** Clear all creatures and reset session
**When:** DM clicks "Clear Combat" or "New Combat"

**Payload:** None (empty object)

**Server Behavior:**
- Clears initiative_order array
- Resets current_turn_index to 0
- Resets round to 1
- Stops timer if active
- Generates new session_id
- Broadcasts `state:update`

---

## Error Handling

### Event: `error`

**Direction:** Server → Client
**Purpose:** Report error to client
**When:** Invalid request, validation failure, server error

**Payload:**
```typescript
{
  message: string,
  code?: string,
  details?: any
}
```

**Examples:**

```json
// Validation error
{
  "message": "Invalid initiative value",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "initiative",
    "value": 150,
    "constraint": "must be 1-99"
  }
}

// Not found error
{
  "message": "Saved session not found",
  "code": "NOT_FOUND",
  "details": {
    "name": "Nonexistent Session"
  }
}

// Authorization error
{
  "message": "Not your turn",
  "code": "UNAUTHORIZED",
  "details": {
    "device_id": "esp32_002",
    "current_device_id": "esp32_001"
  }
}
```

---

## Connection Events

### Event: `connect`

**Direction:** Server → Client (Socket.IO built-in)
**Purpose:** Confirm WebSocket connection established
**When:** Connection handshake completes

**Payload:** None

**Client Action:** Send `identify` event

---

### Event: `disconnect`

**Direction:** Server → Client (Socket.IO built-in)
**Purpose:** Notify connection lost
**When:** Network interruption, server shutdown

**Payload:** Reason string

**Client Action:** Attempt reconnection (handled by Socket.IO)

---

### Event: `reconnect`

**Direction:** Server → Client (Socket.IO built-in)
**Purpose:** Notify successful reconnection
**When:** After disconnect and successful reconnect

**Payload:** None

**Client Action:** Request state resync via `state:request`

---

## Summary Table

| Event | Direction | Purpose | Priority |
|-------|-----------|---------|----------|
| `identify` | C→S | Client identification | Critical |
| `state:update` | S→C | Full state sync | Critical |
| `state:request` | C→S | Request state resync | High |
| `initiative:reorder` | C→S | Reorder creatures | High |
| `creature:add` | C→S | Add creature | High |
| `creature:remove` | C→S | Remove creature | High |
| `turn:next` | C→S | Advance turn | Critical |
| `turn:end` | C→S | Player ends turn | Critical |
| `turn:changed` | S→C | Turn change notification | Medium |
| `timer:start` | C→S | Start timer | High |
| `timer:stop` | C→S | Stop timer | High |
| `timer:tick` | S→C | Timer update | High |
| `timer:expired` | S→C | Timer finished | Medium |
| `player:status` | S→C | Player-specific status | High |
| `display:show_content` | C→S | Show content on display | Medium |
| `display:content` | S→C | Content for display | Medium |
| `display:show_initiative` | C→S | Return to initiative view | Medium |
| `display:mode` | S→C | Set display mode | Medium |
| `state:save` | C→S | Save session | High |
| `state:saved` | S→C | Save confirmation | Medium |
| `state:restore` | C→S | Restore session | High |
| `state:list_saves` | C→S | Request saves list | Medium |
| `state:saves_list` | S→C | Saves list | Medium |
| `session:clear` | C→S | Clear session | Medium |
| `error` | S→C | Error notification | High |

**Legend:**
- C→S: Client to Server
- S→C: Server to Client (broadcast or targeted)
