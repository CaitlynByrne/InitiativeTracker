# User Stories

## Overview

This document contains user stories for all roles and devices in the Initiative Tracker system.

## Roles

- **Dungeon Master (DM)**: Controls the game flow, manages initiative order
- **Player**: Participates in combat, uses personal device to track turn
- **Table**: Shared display for all participants to view

## Story Categories

### [Dungeon Master Stories](dm-stories.md)
Stories related to the DM console and game management capabilities.

### [Player Stories](player-stories.md)
Stories related to individual player devices and turn management.

### [Display Stories](display-stories.md)
Stories related to the shared table display.

### [System Stories](system-stories.md)
Cross-cutting stories about reliability, performance, and deployment.

## Story Format

Each story follows this template:

```
### [ID] Story Title

**As a** [role]
**I want** [goal]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Priority:** High/Medium/Low
**Complexity:** High/Medium/Low
**Dependencies:** List of other story IDs
```

## Priority Definitions

- **High**: Core functionality, must-have for MVP
- **Medium**: Important but not critical for initial release
- **Low**: Nice-to-have, future enhancement

## Complexity Definitions

- **High**: >3 days development, multiple components affected
- **Medium**: 1-3 days development, single component
- **Low**: <1 day development, isolated change
