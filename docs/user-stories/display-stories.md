# Shared Display Stories

## Initiative Display

### [DSP-1] Show Current Initiative Order

**As a** Table Participant
**I want** to see the full initiative order on the shared display
**So that** everyone knows the turn sequence

**Acceptance Criteria:**
- [ ] Initiative list visible and readable from across the table (6+ feet)
- [ ] Creatures listed in initiative order (highest to lowest)
- [ ] Initiative values shown next to names
- [ ] Current turn highlighted prominently
- [ ] On-deck creature indicated differently
- [ ] List auto-scrolls if needed to keep current turn visible
- [ ] Updates within 100ms of server state changes

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

### [DSP-2] Display Round Number

**As a** Table Participant
**I want** to see the current round number
**So that** I can track duration-based effects

**Acceptance Criteria:**
- [ ] Round number prominently displayed
- [ ] Updates when round increments
- [ ] Large enough to read from across table
- [ ] Positioned consistently (top of screen)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** DSP-1

---

### [DSP-3] Show Timer Countdown

**As a** Table Participant
**I want** to see the active turn timer
**So that** the current player knows how much time remains

**Acceptance Criteria:**
- [ ] Timer displayed in large format when active
- [ ] Updates every second
- [ ] Format: M:SS (e.g., 1:30)
- [ ] Visual warning when <10 seconds remain (color change)
- [ ] Timer only shown when active
- [ ] Readable from across table

**Priority:** High
**Complexity:** Low
**Dependencies:** DSP-1

---

### [DSP-4] Distinguish Player vs NPC

**As a** Table Participant
**I want** to visually distinguish player characters from NPCs
**So that** I can quickly identify creature types

**Acceptance Criteria:**
- [ ] Players and NPCs have different visual styling
- [ ] Color coding or icon system
- [ ] Consistent color scheme
- [ ] Visible without color perception (icons/text)

**Priority:** Low
**Complexity:** Low
**Dependencies:** DSP-1

---

## Content Display

### [DSP-5] Show Monster/NPC Images

**As a** Table Participant
**I want** to see images of monsters/NPCs on the shared display
**So that** I can visualize what we're fighting

**Acceptance Criteria:**
- [ ] Image fills screen or displays large
- [ ] Image loads within 1 second of DM triggering
- [ ] Maintains aspect ratio (no distortion)
- [ ] Can return to initiative view with one click/command
- [ ] Supports common formats (JPG, PNG)

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** None

---

### [DSP-6] Show Condition Descriptions

**As a** Table Participant
**I want** to see condition descriptions (poisoned, stunned, etc.)
**So that** we can reference rules without looking them up

**Acceptance Criteria:**
- [ ] Condition name displayed as heading
- [ ] Description text readable from table distance
- [ ] Text formatted for readability
- [ ] Can show multiple conditions simultaneously (optional)
- [ ] Returns to initiative view on DM command

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [DSP-7] Display Maps or Battle Grids

**As a** Table Participant
**I want** to see battle maps on the shared display
**So that** we can reference positioning

**Acceptance Criteria:**
- [ ] Map image fills screen
- [ ] Maintains aspect ratio
- [ ] Can zoom/pan if image is large (optional)
- [ ] Can overlay initiative list on map (optional)
- [ ] Returns to initiative view on command

**Priority:** Low
**Complexity:** High
**Dependencies:** DSP-5

---

## Auto-Start & Reliability

### [DSP-8] Auto-Start on Boot

**As a** DM
**I want** the display to automatically show the initiative tracker on boot
**So that** I can just plug it in and it works

**Acceptance Criteria:**
- [ ] Boots directly to browser in kiosk mode
- [ ] Automatically connects to server
- [ ] No login or interaction required
- [ ] Works after power cycle
- [ ] Displays loading screen while connecting

**Priority:** High
**Complexity:** High
**Dependencies:** None

---

### [DSP-9] Auto-Reconnect After Network Issues

**As a** DM
**I want** the display to reconnect if WiFi drops
**So that** I don't have to manually restart during games

**Acceptance Criteria:**
- [ ] Automatically attempts reconnection
- [ ] Shows "Connecting..." message during reconnection
- [ ] State syncs when reconnected
- [ ] Displays last known state while disconnected
- [ ] No manual intervention required

**Priority:** High
**Complexity:** Medium
**Dependencies:** DSP-8

---

### [DSP-10] Prevent Screen Blanking

**As a** DM
**I want** the display to never turn off or sleep
**So that** initiative is always visible

**Acceptance Criteria:**
- [ ] Screen saver disabled
- [ ] Power management disabled
- [ ] Display stays on continuously
- [ ] No screen dimming
- [ ] Configuration persists across reboots

**Priority:** High
**Complexity:** Low
**Dependencies:** DSP-8

---

## Layout & Responsiveness

### [DSP-11] Support Multiple Display Resolutions

**As a** DM
**I want** the display to work on different sized TVs/monitors
**So that** I can use whatever display is available

**Acceptance Criteria:**
- [ ] Works on 720p (1280x720) displays
- [ ] Works on 1080p (1920x1080) displays
- [ ] Works on 4K (3840x2160) displays
- [ ] Layout scales appropriately to resolution
- [ ] Text remains readable at all resolutions
- [ ] No horizontal scrolling required

**Priority:** High
**Complexity:** Medium
**Dependencies:** All display UI stories

---

### [DSP-12] Portrait and Landscape Orientation

**As a** DM
**I want** the display to work in both orientations
**So that** I can mount the display however fits my setup

**Acceptance Criteria:**
- [ ] Layout adapts to portrait orientation
- [ ] Layout adapts to landscape orientation
- [ ] Detects orientation automatically
- [ ] No content cut off in either orientation
- [ ] Optimal use of screen space in both modes

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** DSP-11

---

### [DSP-13] Readable from Distance

**As a** Table Participant
**I want** all text to be readable from 6-8 feet away
**So that** everyone at the table can see the display

**Acceptance Criteria:**
- [ ] Minimum font size tested at target distance
- [ ] High contrast between text and background
- [ ] Clear, sans-serif fonts
- [ ] Bold weights for important information
- [ ] No critical information in small text

**Priority:** High
**Complexity:** Low
**Dependencies:** DSP-1

---

## Visual Design

### [DSP-14] Clear Visual Hierarchy

**As a** Table Participant
**I want** the most important information to stand out
**So that** I can quickly glance and understand the state

**Acceptance Criteria:**
- [ ] Current turn creature largest/most prominent
- [ ] On-deck creature secondary prominence
- [ ] Timer highly visible when active
- [ ] Remaining initiative list visible but de-emphasized
- [ ] Round number visible but not distracting

**Priority:** High
**Complexity:** Low
**Dependencies:** DSP-1

---

### [DSP-15] Themed Visual Design

**As a** Table Participant
**I want** the display to look thematic and appealing
**So that** it enhances the game atmosphere

**Acceptance Criteria:**
- [ ] Fantasy/RPG-themed color scheme
- [ ] Professional, polished appearance
- [ ] Consistent styling across all views
- [ ] Not overly distracting or garish
- [ ] Theme configurable (optional)

**Priority:** Low
**Complexity:** Medium
**Dependencies:** All display stories

---

## Error Handling

### [DSP-16] Show Connection Error State

**As a** DM
**I want** clear error messages when display can't connect
**So that** I know what's wrong and can fix it

**Acceptance Criteria:**
- [ ] "Cannot connect to server" message displayed
- [ ] Server URL/IP shown for verification
- [ ] Reconnection countdown shown
- [ ] Error doesn't prevent viewing last state
- [ ] Instructions for troubleshooting (optional)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** DSP-9

---

### [DSP-17] Graceful Content Load Failures

**As a** Table Participant
**I want** clear messaging when images fail to load
**So that** we know why content isn't showing

**Acceptance Criteria:**
- [ ] "Image failed to load" message shown
- [ ] Placeholder image displayed
- [ ] Can retry loading
- [ ] Timeout after 5 seconds
- [ ] Fallback to initiative view

**Priority:** Low
**Complexity:** Low
**Dependencies:** DSP-5

---

## Performance

### [DSP-18] Smooth Animations

**As a** Table Participant
**I want** smooth transitions between states
**So that** the display feels polished and professional

**Acceptance Criteria:**
- [ ] Turn changes animate smoothly (slide/fade)
- [ ] Initiative reorders animate smoothly
- [ ] Content transitions smooth
- [ ] 60fps target for animations
- [ ] Animations don't delay state updates

**Priority:** Low
**Complexity:** Medium
**Dependencies:** All display UI stories

---

### [DSP-19] Low Latency Updates

**As a** Table Participant
**I want** the display to update immediately with server changes
**So that** it stays synchronized with DM actions

**Acceptance Criteria:**
- [ ] Updates appear within 100ms of server broadcast
- [ ] No perceptible lag from DM console to display
- [ ] WebSocket connection maintained
- [ ] Updates don't cause screen flicker

**Priority:** High
**Complexity:** Low
**Dependencies:** DSP-1
