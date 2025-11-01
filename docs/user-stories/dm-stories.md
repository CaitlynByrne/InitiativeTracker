# Dungeon Master Stories

## Initiative Management

### [DM-1] Add Creature to Initiative

**As a** Dungeon Master
**I want** to add creatures (players and NPCs) to the initiative order
**So that** I can track who participates in combat

**Acceptance Criteria:**
- [ ] Can enter creature name
- [ ] Can enter initiative value (number)
- [ ] Can specify creature type (Player/NPC)
- [ ] Can optionally assign to player device ID
- [ ] Creatures are automatically sorted by initiative value (highest first)
- [ ] New creature appears in initiative list immediately
- [ ] All connected devices see the update within 100ms

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

### [DM-2] Remove Creature from Initiative

**As a** Dungeon Master
**I want** to remove creatures from the initiative order
**So that** I can clean up when creatures die or leave combat

**Acceptance Criteria:**
- [ ] Can click/tap remove button next to creature
- [ ] Creature is removed from initiative list immediately
- [ ] If removed creature was current turn, advance to next creature
- [ ] All connected devices see the update within 100ms
- [ ] Confirmation dialog prevents accidental removal

**Priority:** High
**Complexity:** Low
**Dependencies:** DM-1

---

### [DM-3] Reorder Initiative

**As a** Dungeon Master
**I want** to drag and drop creatures to reorder initiative
**So that** I can adjust for readied actions, delays, or corrections

**Acceptance Criteria:**
- [ ] Can drag creature entries up or down
- [ ] Visual feedback during drag operation
- [ ] Initiative values update to match new order (optional)
- [ ] Order persists immediately
- [ ] All connected devices see new order within 100ms
- [ ] Current turn indicator moves with dragged creature if applicable

**Priority:** High
**Complexity:** Medium
**Dependencies:** DM-1

---

### [DM-4] View Current Initiative Order

**As a** Dungeon Master
**I want** to see the full initiative order at all times
**So that** I know who goes when and can plan accordingly

**Acceptance Criteria:**
- [ ] Initiative list visible on main screen
- [ ] Current turn clearly highlighted/indicated
- [ ] Initiative values displayed next to names
- [ ] Creature type (Player/NPC) visually distinguished
- [ ] Round number displayed
- [ ] List scrollable if many creatures

**Priority:** High
**Complexity:** Low
**Dependencies:** DM-1

---

## Turn Management

### [DM-5] Advance to Next Turn

**As a** Dungeon Master
**I want** to manually advance to the next creature's turn
**So that** I can control the pace of combat

**Acceptance Criteria:**
- [ ] "Next Turn" button clearly visible
- [ ] Clicking advances to next creature in order
- [ ] At end of list, wraps to top and increments round
- [ ] All devices notified of turn change immediately
- [ ] Active timers stop when turn advances
- [ ] Current turn highlight updates

**Priority:** High
**Complexity:** Medium
**Dependencies:** DM-1, DM-4

---

### [DM-6] View Turn History

**As a** Dungeon Master
**I want** to see whose turn it was previously
**So that** I can verify turn order or roll back mistakes

**Acceptance Criteria:**
- [ ] Previous turn creature indicated/highlighted differently
- [ ] Can see last 3 turns in history
- [ ] History clears when combat ends

**Priority:** Low
**Complexity:** Medium
**Dependencies:** DM-5

---

## Timer Management

### [DM-7] Start Turn Timer

**As a** Dungeon Master
**I want** to start a countdown timer for player turns
**So that** I can keep combat moving and prevent analysis paralysis

**Acceptance Criteria:**
- [ ] Can click "Start Timer" button
- [ ] Can select duration (30s, 60s, 90s, 2min, custom)
- [ ] Timer starts counting down immediately
- [ ] Timer visible on all connected devices
- [ ] Timer ticks every second
- [ ] Visual/audio alert when timer expires
- [ ] Can start timer for any creature's turn

**Priority:** High
**Complexity:** Medium
**Dependencies:** DM-4

---

### [DM-8] Stop/Pause Timer

**As a** Dungeon Master
**I want** to stop or pause an active timer
**So that** I can accommodate questions, rules discussions, or emergencies

**Acceptance Criteria:**
- [ ] "Stop Timer" button visible when timer active
- [ ] Clicking stops and resets timer
- [ ] All devices see timer stopped immediately
- [ ] Can resume timer (bonus feature)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** DM-7

---

### [DM-9] Configure Default Timer Duration

**As a** Dungeon Master
**I want** to set a default timer duration
**So that** I don't have to select it every time

**Acceptance Criteria:**
- [ ] Settings panel with duration selector
- [ ] Duration persists across sessions
- [ ] "Quick Start" button uses default duration
- [ ] Can still override for individual turns

**Priority:** Low
**Complexity:** Low
**Dependencies:** DM-7

---

## Session Management

### [DM-10] Save Session State

**As a** Dungeon Master
**I want** to save the current combat state
**So that** I can resume combat in a future game session

**Acceptance Criteria:**
- [ ] "Save Session" button clearly visible
- [ ] Can provide session name/label
- [ ] Saves complete initiative order
- [ ] Saves current turn position
- [ ] Saves round number
- [ ] Confirmation message on successful save
- [ ] Shows timestamp of last save

**Priority:** High
**Complexity:** Medium
**Dependencies:** DM-1, DM-4

---

### [DM-11] Restore Session State

**As a** Dungeon Master
**I want** to load a previously saved combat session
**So that** I can continue multi-session combats

**Acceptance Criteria:**
- [ ] "Restore Session" button visible
- [ ] Shows list of saved sessions with names and timestamps
- [ ] Can select session to restore
- [ ] Initiative order restored exactly
- [ ] Current turn position restored
- [ ] Round number restored
- [ ] Confirmation dialog before overwriting current session
- [ ] All devices sync to restored state immediately

**Priority:** High
**Complexity:** Medium
**Dependencies:** DM-10

---

### [DM-12] Clear/Reset Combat

**As a** Dungeon Master
**I want** to clear all creatures and start fresh
**So that** I can begin a new combat encounter

**Acceptance Criteria:**
- [ ] "Clear Combat" or "New Combat" button
- [ ] Confirmation dialog to prevent accidents
- [ ] Removes all creatures from initiative
- [ ] Resets round to 1
- [ ] Stops any active timers
- [ ] All devices cleared immediately
- [ ] Option to save before clearing

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

## Display Control

### [DM-13] Show Content on Shared Display

**As a** Dungeon Master
**I want** to display images or reference material on the shared table display
**So that** I can show players monster art, condition descriptions, or maps

**Acceptance Criteria:**
- [ ] Button to "Show on Display"
- [ ] Can select from predefined conditions
- [ ] Can upload/select image file
- [ ] Image appears on Pi display within 1 second
- [ ] Can return to initiative view from display
- [ ] Image scales to fit display properly

**Priority:** Medium
**Complexity:** High
**Dependencies:** None

---

### [DM-14] Control Display View Mode

**As a** Dungeon Master
**I want** to switch the shared display between initiative view and custom content
**So that** I can control what players see

**Acceptance Criteria:**
- [ ] Toggle between "Initiative" and "Content" modes
- [ ] Mode change reflected on Pi display immediately
- [ ] Current mode indicated in DM console
- [ ] Initiative mode shows by default

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** DM-13

---

## Connection Management

### [DM-15] View Device Connection Status

**As a** Dungeon Master
**I want** to see which player devices are connected
**So that** I know if players' screens are working

**Acceptance Criteria:**
- [ ] List of expected player devices
- [ ] Connection status indicator (connected/disconnected)
- [ ] Last seen timestamp for disconnected devices
- [ ] Visual alert for disconnections
- [ ] Can identify which player owns which device

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** None

---

### [DM-16] Access Console from Any Device

**As a** Dungeon Master
**I want** to access the DM console from tablet or laptop
**So that** I can use whatever device is convenient

**Acceptance Criteria:**
- [ ] Responsive web interface works on desktop
- [ ] Responsive web interface works on tablet
- [ ] Touch-friendly controls on tablet
- [ ] Drag-and-drop works with touch
- [ ] Can use multiple DM consoles simultaneously (same state)

**Priority:** High
**Complexity:** Low
**Dependencies:** All UI stories

---

## Notifications & Feedback

### [DM-17] Receive Player Turn End Notifications

**As a** Dungeon Master
**I want** to be notified when a player ends their turn via their device
**So that** I know when to advance to the next turn

**Acceptance Criteria:**
- [ ] Visual indicator when player taps "End Turn"
- [ ] Initiative automatically advances to next creature
- [ ] Notification shown for 2-3 seconds
- [ ] Optional audio cue (can be disabled)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** DM-5

---

### [DM-18] View System Connection Status

**As a** Dungeon Master
**I want** to see if my console is connected to the server
**So that** I know if commands will work

**Acceptance Criteria:**
- [ ] Connection status indicator visible (connected/disconnected)
- [ ] Indicator updates immediately on connection change
- [ ] Warning message if disconnected
- [ ] Automatic reconnection attempt
- [ ] Notification when reconnected

**Priority:** High
**Complexity:** Low
**Dependencies:** None
