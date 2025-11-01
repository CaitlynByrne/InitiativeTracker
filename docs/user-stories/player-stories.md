# Player Stories

## Turn Awareness

### [PLR-1] See When It's My Turn

**As a** Player
**I want** my device to clearly show when it's my turn
**So that** I know when to act and don't hold up the game

**Acceptance Criteria:**
- [ ] Screen changes color/style when my turn starts
- [ ] Large "YOUR TURN" message displayed
- [ ] Device wakes from sleep/dim state when turn starts
- [ ] Visual change occurs within 100ms of turn change
- [ ] Screen remains bright/active during my turn
- [ ] Different visual state when not my turn

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

### [PLR-2] See My Position in Initiative

**As a** Player
**I want** to see my position in the initiative order
**So that** I know how soon my turn is coming

**Acceptance Criteria:**
- [ ] Current position number displayed (e.g., "Position: #3")
- [ ] Position updates when initiative order changes
- [ ] Position visible at all times (not just during my turn)
- [ ] Clear typography, readable at arm's length

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [PLR-3] See "On Deck" Indicator

**As a** Player
**I want** to be notified when I'm next in line
**So that** I can prepare my action and be ready

**Acceptance Criteria:**
- [ ] "On Deck" or "You're Next" message when I'm next
- [ ] Different visual state than "your turn" (e.g., yellow vs green)
- [ ] Device brightens from sleep when on deck
- [ ] Clear distinction between on-deck, current, and waiting states

**Priority:** High
**Complexity:** Low
**Dependencies:** PLR-1

---

### [PLR-4] See Timer Countdown

**As a** Player
**I want** to see time remaining when a turn timer is active
**So that** I can manage my decision-making time

**Acceptance Criteria:**
- [ ] Timer displayed in large, readable format (M:SS)
- [ ] Updates every second
- [ ] Only shown when timer is active
- [ ] Visual warning when time is running low (last 10 seconds)
- [ ] Timer visible during my turn and when on deck

**Priority:** High
**Complexity:** Low
**Dependencies:** None

---

## Turn Control

### [PLR-5] End My Turn

**As a** Player
**I want** to tap a button to signal my turn is complete
**So that** the game can move to the next player quickly

**Acceptance Criteria:**
- [ ] Large "End Turn" button visible during my turn
- [ ] Button only visible/enabled during my turn
- [ ] Tapping button notifies server
- [ ] Initiative advances to next player
- [ ] Visual feedback on button tap (animation/haptic if supported)
- [ ] Button positioned for easy thumb access

**Priority:** High
**Complexity:** Medium
**Dependencies:** PLR-1

---

### [PLR-6] Confirm Turn End

**As a** Player
**I want** a confirmation before ending my turn
**So that** I don't accidentally skip my turn

**Acceptance Criteria:**
- [ ] Optional confirmation dialog (configurable)
- [ ] Quick double-tap alternative to confirmation
- [ ] Confirmation timeout (auto-cancel after 3s)
- [ ] Can disable confirmation in settings

**Priority:** Low
**Complexity:** Low
**Dependencies:** PLR-5

---

## Device Management

### [PLR-7] See Connection Status

**As a** Player
**I want** to see if my device is connected to the server
**So that** I know if I'll be notified of my turn

**Acceptance Criteria:**
- [ ] Connection indicator visible (icon or text)
- [ ] "Connected" state clearly shown
- [ ] "Disconnected" state prominently displayed with warning
- [ ] "Connecting..." state shown during reconnection
- [ ] Indicator doesn't obscure main content

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

### [PLR-8] Auto-Reconnect After Disconnection

**As a** Player
**I want** my device to automatically reconnect if WiFi drops
**So that** I don't have to manually restart during the game

**Acceptance Criteria:**
- [ ] Automatic reconnection attempts when disconnected
- [ ] Exponential backoff between attempts (1s, 2s, 4s, 5s max)
- [ ] Infinite retry attempts
- [ ] State syncs automatically on reconnection
- [ ] User notified when reconnected

**Priority:** High
**Complexity:** Medium
**Dependencies:** PLR-7

---

### [PLR-9] Low Battery Warning

**As a** Player
**I want** to be warned when device battery is low
**So that** I can charge it before it dies mid-game

**Acceptance Criteria:**
- [ ] Battery level indicator visible
- [ ] Warning shown at 20% battery
- [ ] Critical warning at 10% battery
- [ ] Battery percentage displayed
- [ ] Indicator doesn't obstruct main content

**Priority:** Medium
**Complexity:** Low
**Dependencies:** None

---

## Power Management

### [PLR-10] Sleep When Not My Turn

**As a** Player
**I want** my device to dim/sleep when it's not my turn
**So that** battery lasts through long game sessions

**Acceptance Criteria:**
- [ ] Screen dims after 10 seconds when not my turn
- [ ] Screen sleeps after 30 seconds when not my turn (if supported)
- [ ] Instantly wakes when my turn starts
- [ ] Wakes when I'm on deck
- [ ] Can tap screen to wake manually
- [ ] WiFi remains active during sleep

**Priority:** Medium
**Complexity:** High
**Dependencies:** PLR-1, PLR-3

---

### [PLR-11] Configurable Brightness

**As a** Player
**I want** to adjust screen brightness
**So that** I can optimize for lighting conditions and battery life

**Acceptance Criteria:**
- [ ] Brightness control accessible (slider or buttons)
- [ ] Settings persist across power cycles
- [ ] Separate brightness for "active" and "idle" states
- [ ] Can disable auto-dimming if desired

**Priority:** Low
**Complexity:** Low
**Dependencies:** None

---

## User Experience

### [PLR-12] Large Touch Targets

**As a** Player
**I want** large, easy-to-tap buttons
**So that** I can use the device reliably even when excited/rushed

**Acceptance Criteria:**
- [ ] "End Turn" button minimum 60x60 pixels
- [ ] Touch targets meet accessibility guidelines (44x44 minimum)
- [ ] Adequate spacing between interactive elements
- [ ] Works with gloves (if possible)

**Priority:** Medium
**Complexity:** Low
**Dependencies:** PLR-5

---

### [PLR-13] Clear Visual Hierarchy

**As a** Player
**I want** the most important information to be largest/most prominent
**So that** I can quickly glance at my device and understand status

**Acceptance Criteria:**
- [ ] Turn status (YOUR TURN/On Deck/Waiting) most prominent
- [ ] Timer second-most prominent when active
- [ ] Position number tertiary importance
- [ ] Connection status subtle but noticeable
- [ ] Can read from 12-18 inches away

**Priority:** High
**Complexity:** Low
**Dependencies:** PLR-1, PLR-3, PLR-4

---

### [PLR-14] Responsive to Different Display Sizes

**As a** Player
**I want** the interface to work on different sized ESP32 displays
**So that** players can use different hardware

**Acceptance Criteria:**
- [ ] Works on 240x135 displays (small)
- [ ] Works on 320x240 displays (medium)
- [ ] Works on 480x320 displays (large)
- [ ] Layout adapts to screen size
- [ ] Font sizes scale appropriately
- [ ] All content visible without scrolling

**Priority:** High
**Complexity:** Medium
**Dependencies:** All UI stories

---

## Accessibility

### [PLR-15] High Contrast Mode

**As a** Player
**I want** a high-contrast color scheme option
**So that** I can read the display even with vision limitations

**Acceptance Criteria:**
- [ ] High-contrast mode toggle in settings
- [ ] Meets WCAG AA contrast ratios
- [ ] Works with all states (turn, on-deck, waiting)
- [ ] Preference persists across sessions

**Priority:** Low
**Complexity:** Low
**Dependencies:** None

---

### [PLR-16] Audio Notifications

**As a** Player
**I want** optional audio alerts when my turn starts
**So that** I can be notified even if not looking at device

**Acceptance Criteria:**
- [ ] Tone/beep plays when turn starts
- [ ] Different tone for "on deck"
- [ ] Volume control in settings
- [ ] Can disable audio entirely
- [ ] Short, non-disruptive sounds

**Priority:** Low
**Complexity:** Medium
**Dependencies:** PLR-1, PLR-3

---

## Initial Setup

### [PLR-17] Easy WiFi Configuration

**As a** Player
**I want** simple WiFi setup
**So that** I can connect without technical knowledge

**Acceptance Criteria:**
- [ ] WiFi credentials pre-configured (DM sets up)
- [ ] Or: WiFi AP mode for initial config
- [ ] Or: Hardcoded for specific network
- [ ] Clear error messages if connection fails
- [ ] Instructions visible on screen

**Priority:** High
**Complexity:** High
**Dependencies:** None

---

### [PLR-18] Device Identification

**As a** Player
**I want** my device to identify itself automatically
**So that** I don't need to configure anything

**Acceptance Criteria:**
- [ ] Device ID configured at flash time or hardcoded
- [ ] Device sends ID on connection
- [ ] Server associates device with player name
- [ ] Player name visible on device (optional)

**Priority:** Medium
**Complexity:** Medium
**Dependencies:** PLR-17
