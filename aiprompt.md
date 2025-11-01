# **Comprehensive AI Agent Prompt: Initiative Tracker MVP Development**

## **🚨 QUICK STATUS - November 1, 2025**
**Project is 65% Complete!** Server and DM Console are mostly done. Main missing piece is the Pi Display frontend.

### **What Needs to Be Done NOW:**
1. **Create Pi Display Frontend** (web/pi-display/) - This is the main missing component
2. **Test the system end-to-end** - Start Docker containers and verify everything works
3. **Fix any bugs found during testing**

### **What's Already Done:**
- ✅ Server backend (fully functional)
- ✅ DM Console frontend (complete UI)
- ✅ Docker infrastructure (configured)
- ✅ WebSocket communication (working)

**Time to Complete: ~5-8 hours**

---

## **Mission**
You are an expert full-stack developer tasked with implementing the **Minimum Viable Product (MVP)** for the Initiative Tracker system. Your goal is to build a functional real-time initiative tracking system with a Node.js WebSocket server and Vue.js DM Console that can demonstrate core gameplay on a laptop and Raspberry Pi display.

---

## **Project Context**

### **What This System Does**
Initiative Tracker coordinates turn order for tabletop RPG combat across multiple devices in real-time using WebSocket communication. The DM controls initiative from a laptop, while players and shared displays show synchronized game state.

### **Current State (65% Complete)**
- ✅ **Server backend logic**: StateManager, TimerManager, event handlers fully implemented
- ✅ **Project scaffolding**: TypeScript configs, dependencies, Docker setup complete
- ✅ **DM Console**: Functional UI with all core components (AddCreatureForm, InitiativeList, ControlPanel)
- ✅ **WebSocket Integration**: Real-time state synchronization working
- ✅ **Docker Infrastructure**: docker-compose.dev.yml, Dockerfiles configured for all services
- ⚠️ **Testing**: Integration test files exist but not all tests running
- ❌ **Pi Display**: Not yet created - needs full implementation
- ❌ **Persistence**: Redis configured in Docker but not integrated in StateManager
- ❌ **Production Deployment**: Development environment only

### **Your Deliverables**
1. ✅ **Functional WebSocket server** with complete event handling - DONE
2. ✅ **DM Console web app** with initiative management UI - DONE (needs testing)
3. ❌ **Pi Display web app** for shared viewing - NOT STARTED
4. ✅ **Working Docker development environment** - CONFIGURED (needs testing)
5. ⚠️ **Basic integration tests** proving end-to-end functionality - PARTIAL (test files exist)

---

## **Implementation Progress Update (November 1, 2025)**

### **Completed Components**
✅ **Backend Server (server/)**
- Full StateManager implementation with creature/turn/timer management
- Complete TimerManager with 1-second tick intervals
- All WebSocket event handlers (identify, creature:add/remove, turn:next, timer:start/stop, etc.)
- Input validation and error handling
- Logger utility for debugging
- Health check and state debug endpoints
- TypeScript types and interfaces

✅ **DM Console Frontend (web/dm-console/)**
- Complete Vue 3 application with Tailwind CSS
- AddCreatureForm component for adding creatures
- InitiativeList component showing initiative order
- ControlPanel component with turn/timer/session controls
- useGameState composable for WebSocket integration
- Real-time state synchronization
- Connection status indicator
- Error display handling

✅ **Infrastructure (infrastructure/)**
- Docker Compose development configuration
- Redis container for future persistence
- Server and DM Console Dockerfiles
- Volume mounting for hot-reload development
- Health checks and service dependencies

✅ **Testing Setup (tests/)**
- Integration test file structure
- Jest configuration
- Manual WebSocket test client (test-websocket.js)

### **Not Yet Implemented**
❌ **Pi Display Frontend**
- No project created yet in web/pi-display/
- Needs complete implementation from scratch
- Should show large-format initiative display
- Auto-reconnection handling required

❌ **Redis Integration**
- Redis container configured but not connected
- StateManager doesn't persist to Redis yet
- Session save/restore not implemented

❌ **Missing Features**
- Drag-and-drop reordering in UI
- Creature HP tracking in UI
- Conditions tracking
- Session persistence
- Authentication/authorization

### **Next Steps for MVP Completion**
1. **Create Pi Display Frontend** (~3-4 hours)
   - Copy DM Console as starting point
   - Create large-format display components
   - Remove editing controls (read-only display)
   - Optimize for TV/monitor viewing

2. **Test Full System** (~1-2 hours)
   - Start all services via Docker Compose
   - Verify WebSocket communication
   - Test all UI interactions
   - Run integration tests

3. **Bug Fixes & Polish** (~1-2 hours)
   - Fix any issues found during testing
   - Add missing error handling
   - Update documentation

**Estimated Time to Complete MVP: 5-8 hours**

---

## **Technical Architecture**

### **System Components**
```
[DM Laptop Browser] ←→ WebSocket ←→ [Node.js Server] ←→ WebSocket ←→ [Pi Display Browser]
                                            ↓
                                      [StateManager]
                                            ↓
                                      [TimerManager]
```

### **Technology Stack**
- **Backend**: Node.js 18+, Express, Socket.IO 4.x, TypeScript (strict)
- **Frontend**: Vue.js 3, Vite, Tailwind CSS, socket.io-client
- **Infrastructure**: Docker, Docker Compose
- **Testing**: Jest (backend), Vitest (frontend)

### **Key Architectural Patterns**
1. **Single Source of Truth**: Server StateManager holds canonical game state
2. **Event-Driven**: All state changes trigger broadcasts to connected clients
3. **Singleton Pattern**: StateManager and TimerManager are singletons
4. **Hub-and-Spoke**: Server mediates all communication between clients
5. **Validation-First**: All inputs validated before state mutation

---

## **Detailed Implementation Steps**

### **PHASE 1: Backend Server Completion ✅ COMPLETED**

#### **1.1 Review Existing Code**
- Read and understand `/server/src/state/StateManager.ts` (295 lines)
- Study `/server/src/timer/TimerManager.ts` (88 lines)
- Review `/server/src/events/handlers.ts` (150+ lines)
- Examine `/server/src/types/index.ts` for type definitions
- Check `/docs/api/websocket-events.md` for complete event protocol

#### **1.2 Complete Event Handlers** (`/server/src/events/handlers.ts`)
**Currently implemented**: `creature:add`, `creature:remove`, `turn:next`, `initiative:reorder`, `timer:start`, `timer:stop`, `session:reset`, `state:request`

**Add these missing handlers**:
```typescript
// 1. Session management events
socket.on('session:clear', () => {
  // Reset state and broadcast to all clients
  stateManager.reset();
  io.emit('state:update', stateManager.getState());
});

// 2. Timer stop with validation
socket.on('timer:stop', () => {
  stateManager.stopTimer();
  io.emit('state:update', stateManager.getState());
});

// 3. Player turn completion (from ESP32 devices later)
socket.on('turn:end', (data: { creatureId: string }) => {
  // Validate creature exists and is current turn
  // Advance turn automatically
  const state = stateManager.getState();
  if (state.creatures[state.currentTurnIndex]?.id === data.creatureId) {
    stateManager.nextTurn();
    io.emit('state:update', stateManager.getState());
  }
});
```

**Add comprehensive error handling**:
```typescript
// Wrap all event handlers with try-catch
socket.on('creature:add', (data, callback) => {
  try {
    const errors = validateCreature(data);
    if (errors.length > 0) {
      socket.emit('error', {
        message: 'Validation failed',
        errors,
        event: 'creature:add'
      });
      return;
    }

    stateManager.addCreature(data);
    io.emit('state:update', stateManager.getState());

    if (callback) callback({ success: true });
  } catch (error) {
    console.error('Error in creature:add:', error);
    socket.emit('error', {
      message: error.message,
      event: 'creature:add'
    });
    if (callback) callback({ success: false, error: error.message });
  }
});
```

#### **1.3 Add Logging** (`/server/src/utils/logger.ts`)
Create a simple logger utility:
```typescript
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
};
```

Integrate logging into:
- Connection/disconnection events
- All state mutations
- Error conditions
- Timer ticks (debug level)

#### **1.4 Enhance StateManager** (`/server/src/state/StateManager.ts`)
Add these missing features:
```typescript
// Update creature properties
public updateCreature(id: string, updates: Partial<Creature>): void {
  const index = this.state.creatures.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Creature not found');

  const creature = { ...this.state.creatures[index], ...updates };
  const errors = validateCreature(creature);
  if (errors.length > 0) throw new Error(errors.join(', '));

  this.state.creatures[index] = creature;
  this.emit('stateChanged', this.state);
}

// Get creature by ID
public getCreature(id: string): Creature | undefined {
  return this.state.creatures.find(c => c.id === id);
}

// Get current turn creature
public getCurrentCreature(): Creature | undefined {
  return this.state.creatures[this.state.currentTurnIndex];
}
```

#### **1.5 Test Server Manually**
- Start server: `cd server && npm run dev`
- Check health endpoint: `curl http://localhost:3001/health`
- Check state endpoint: `curl http://localhost:3001/state`
- Use a WebSocket test tool or browser console to test events

---

### **PHASE 2: DM Console Frontend ✅ COMPLETED (needs testing)**

#### **2.1 Set Up State Management** (`/web/dm-console/src/composables/useGameState.ts`)
Create a Vue composable for WebSocket integration:
```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { GameState, Creature } from '../types';

export function useGameState() {
  const socket = ref<Socket | null>(null);
  const gameState = ref<GameState>({
    creatures: [],
    currentTurnIndex: 0,
    currentRound: 1,
    timer: null
  });
  const connected = ref(false);
  const error = ref<string | null>(null);

  const connect = () => {
    socket.value = io('http://localhost:3001');

    socket.value.on('connect', () => {
      connected.value = true;
      socket.value?.emit('identify', { type: 'dm', name: 'DM Console' });
      socket.value?.emit('state:request');
    });

    socket.value.on('state:update', (state: GameState) => {
      gameState.value = state;
    });

    socket.value.on('error', (err: any) => {
      error.value = err.message || 'Unknown error';
      setTimeout(() => error.value = null, 5000);
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });
  };

  const addCreature = (creature: Omit<Creature, 'id'>) => {
    socket.value?.emit('creature:add', {
      ...creature,
      id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  const removeCreature = (id: string) => {
    socket.value?.emit('creature:remove', { id });
  };

  const nextTurn = () => {
    socket.value?.emit('turn:next');
  };

  const startTimer = (seconds: number) => {
    socket.value?.emit('timer:start', { seconds });
  };

  const stopTimer = () => {
    socket.value?.emit('timer:stop');
  };

  const resetSession = () => {
    if (confirm('Reset entire session? This cannot be undone.')) {
      socket.value?.emit('session:reset');
    }
  };

  const reorderInitiative = (fromIndex: number, toIndex: number) => {
    socket.value?.emit('initiative:reorder', { fromIndex, toIndex });
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  return {
    gameState,
    connected,
    error,
    addCreature,
    removeCreature,
    nextTurn,
    startTimer,
    stopTimer,
    resetSession,
    reorderInitiative
  };
}
```

#### **2.2 Create Type Definitions** (`/web/dm-console/src/types/index.ts`)
Copy from server types:
```typescript
export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'npc' | 'monster';
  hp?: number;
  maxHp?: number;
  conditions?: string[];
}

export interface Timer {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
}

export interface GameState {
  creatures: Creature[];
  currentTurnIndex: number;
  currentRound: number;
  timer: Timer | null;
}
```

#### **2.3 Build Initiative List Component** (`/web/dm-console/src/components/InitiativeList.vue`)
```vue
<template>
  <div class="initiative-list bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Initiative Order</h2>

    <div v-if="creatures.length === 0" class="text-gray-400 text-center py-8">
      No creatures in initiative. Add some to get started!
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(creature, index) in creatures"
        :key="creature.id"
        :class="[
          'creature-card p-3 rounded border-2 transition-all',
          index === currentTurnIndex
            ? 'border-green-500 bg-green-900/20'
            : 'border-gray-600 bg-gray-700'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Initiative Badge -->
            <div class="initiative-badge bg-blue-600 text-white font-bold px-3 py-1 rounded">
              {{ creature.initiative }}
            </div>

            <!-- Creature Info -->
            <div>
              <div class="creature-name font-bold text-white">
                {{ creature.name }}
                <span v-if="index === currentTurnIndex" class="ml-2 text-green-400">
                  ← ACTIVE
                </span>
              </div>
              <div class="creature-type text-sm text-gray-400 capitalize">
                {{ creature.type }}
              </div>
            </div>
          </div>

          <!-- HP Display (if available) -->
          <div v-if="creature.hp !== undefined" class="hp-display text-sm text-gray-300">
            HP: {{ creature.hp }}/{{ creature.maxHp }}
          </div>

          <!-- Remove Button -->
          <button
            @click="$emit('remove', creature.id)"
            class="remove-btn text-red-400 hover:text-red-300 px-2 py-1"
            title="Remove creature"
          >
            ✕
          </button>
        </div>

        <!-- Conditions (if any) -->
        <div v-if="creature.conditions && creature.conditions.length > 0"
             class="conditions mt-2 flex gap-1 flex-wrap">
          <span
            v-for="condition in creature.conditions"
            :key="condition"
            class="condition-tag text-xs bg-yellow-800 text-yellow-200 px-2 py-1 rounded"
          >
            {{ condition }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Creature } from '../types';

defineProps<{
  creatures: Creature[];
  currentTurnIndex: number;
}>();

defineEmits<{
  (e: 'remove', id: string): void;
}>();
</script>
```

#### **2.4 Build Add Creature Form** (`/web/dm-console/src/components/AddCreatureForm.vue`)
```vue
<template>
  <div class="add-creature-form bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Add Creature</h2>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="Creature name"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Initiative</label>
        <input
          v-model.number="form.initiative"
          type="number"
          required
          min="1"
          max="30"
          class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="1-30"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Type</label>
        <select
          v-model="form.type"
          required
          class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="player">Player</option>
          <option value="npc">NPC</option>
          <option value="monster">Monster</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">HP (optional)</label>
          <input
            v-model.number="form.hp"
            type="number"
            min="0"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Current HP"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Max HP (optional)</label>
          <input
            v-model.number="form.maxHp"
            type="number"
            min="0"
            class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Max HP"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        Add to Initiative
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { Creature } from '../types';

const emit = defineEmits<{
  (e: 'add', creature: Omit<Creature, 'id'>): void;
}>();

const form = reactive({
  name: '',
  initiative: 10,
  type: 'monster' as 'player' | 'npc' | 'monster',
  hp: undefined as number | undefined,
  maxHp: undefined as number | undefined
});

const handleSubmit = () => {
  const creature: Omit<Creature, 'id'> = {
    name: form.name,
    initiative: form.initiative,
    type: form.type,
  };

  if (form.hp !== undefined) creature.hp = form.hp;
  if (form.maxHp !== undefined) creature.maxHp = form.maxHp;

  emit('add', creature);

  // Reset form
  form.name = '';
  form.initiative = 10;
  form.type = 'monster';
  form.hp = undefined;
  form.maxHp = undefined;
};
</script>
```

#### **2.5 Build Control Panel** (`/web/dm-console/src/components/ControlPanel.vue`)
```vue
<template>
  <div class="control-panel bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Combat Controls</h2>

    <!-- Turn Info -->
    <div class="turn-info bg-gray-700 p-3 rounded mb-4">
      <div class="text-lg font-bold text-white">Round {{ currentRound }}</div>
      <div v-if="currentCreature" class="text-sm text-gray-300">
        Current Turn: {{ currentCreature.name }}
      </div>
    </div>

    <!-- Next Turn Button -->
    <button
      @click="$emit('nextTurn')"
      :disabled="creatures.length === 0"
      class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded mb-4 transition-colors"
    >
      Next Turn →
    </button>

    <!-- Timer Controls -->
    <div class="timer-controls space-y-2 mb-4">
      <h3 class="font-bold text-white">Turn Timer</h3>

      <div v-if="timer && timer.isActive" class="timer-display bg-yellow-900/30 border border-yellow-600 p-3 rounded">
        <div class="text-3xl font-bold text-yellow-300 text-center">
          {{ formatTime(timer.remainingSeconds) }}
        </div>
        <button
          @click="$emit('stopTimer')"
          class="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Stop Timer
        </button>
      </div>

      <div v-else class="timer-presets grid grid-cols-3 gap-2">
        <button
          v-for="seconds in [30, 60, 120]"
          :key="seconds"
          @click="$emit('startTimer', seconds)"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded transition-colors"
        >
          {{ seconds }}s
        </button>
      </div>
    </div>

    <!-- Session Controls -->
    <div class="session-controls">
      <button
        @click="$emit('reset')"
        class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        Reset Session
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Creature, Timer } from '../types';

const props = defineProps<{
  creatures: Creature[];
  currentTurnIndex: number;
  currentRound: number;
  timer: Timer | null;
}>();

defineEmits<{
  (e: 'nextTurn'): void;
  (e: 'startTimer', seconds: number): void;
  (e: 'stopTimer'): void;
  (e: 'reset'): void;
}>();

const currentCreature = computed(() => {
  return props.creatures[props.currentTurnIndex];
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>
```

#### **2.6 Update Main App** (`/web/dm-console/src/App.vue`)
```vue
<template>
  <div class="app min-h-screen bg-gray-900 text-white p-4">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-3xl font-bold">Initiative Tracker - DM Console</h1>
      <div class="flex items-center gap-2 mt-2">
        <div
          :class="[
            'connection-status w-3 h-3 rounded-full',
            connected ? 'bg-green-500' : 'bg-red-500'
          ]"
        ></div>
        <span class="text-sm text-gray-400">
          {{ connected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
    </header>

    <!-- Error Display -->
    <div
      v-if="error"
      class="error-banner bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Left Column: Add Creature Form -->
      <div class="lg:col-span-1">
        <AddCreatureForm @add="addCreature" />
      </div>

      <!-- Middle Column: Initiative List -->
      <div class="lg:col-span-1">
        <InitiativeList
          :creatures="gameState.creatures"
          :current-turn-index="gameState.currentTurnIndex"
          @remove="removeCreature"
        />
      </div>

      <!-- Right Column: Control Panel -->
      <div class="lg:col-span-1">
        <ControlPanel
          :creatures="gameState.creatures"
          :current-turn-index="gameState.currentTurnIndex"
          :current-round="gameState.currentRound"
          :timer="gameState.timer"
          @next-turn="nextTurn"
          @start-timer="startTimer"
          @stop-timer="stopTimer"
          @reset="resetSession"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameState } from './composables/useGameState';
import InitiativeList from './components/InitiativeList.vue';
import AddCreatureForm from './components/AddCreatureForm.vue';
import ControlPanel from './components/ControlPanel.vue';

const {
  gameState,
  connected,
  error,
  addCreature,
  removeCreature,
  nextTurn,
  startTimer,
  stopTimer,
  resetSession
} = useGameState();
</script>
```

#### **2.7 Configure Tailwind** (`/web/dm-console/tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### **2.8 Test DM Console**
- Start dev server: `cd web/dm-console && npm run dev`
- Open browser to `http://localhost:5173`
- Test: Add creatures, advance turns, start/stop timers
- Verify WebSocket connection and real-time updates

---

### **PHASE 3: Pi Display Frontend ❌ NOT STARTED**

#### **3.1 Initialize Project**
```bash
cd web
cp -r dm-console pi-display
cd pi-display
```

#### **3.2 Update package.json**
Change name to `initiative-tracker-pi-display`

#### **3.3 Create Display-Optimized Layout** (`/web/pi-display/src/App.vue`)
```vue
<template>
  <div class="pi-display min-h-screen bg-black text-white flex flex-col">
    <!-- Connection Status (subtle) -->
    <div
      v-if="!connected"
      class="connection-lost bg-red-900 text-center py-2 text-xl"
    >
      ⚠️ Disconnected from server...
    </div>

    <!-- Main Initiative Display -->
    <div class="flex-1 flex flex-col justify-center p-8">
      <!-- Round Counter -->
      <div class="round-display text-center mb-8">
        <div class="text-4xl text-gray-400">Round</div>
        <div class="text-8xl font-bold text-blue-400">{{ gameState.currentRound }}</div>
      </div>

      <!-- Current Turn (Large) -->
      <div v-if="currentCreature" class="current-turn bg-green-900/30 border-4 border-green-500 rounded-2xl p-12 mb-8">
        <div class="text-5xl text-gray-400 mb-4">CURRENT TURN</div>
        <div class="text-9xl font-bold text-green-400 mb-4">
          {{ currentCreature.name }}
        </div>
        <div class="text-6xl text-gray-300">
          Initiative: {{ currentCreature.initiative }}
        </div>
      </div>

      <!-- Timer Display (if active) -->
      <div
        v-if="gameState.timer && gameState.timer.isActive"
        :class="[
          'timer-display text-center p-8 rounded-xl',
          gameState.timer.remainingSeconds <= 10 ? 'bg-red-900/50 border-4 border-red-500' : 'bg-yellow-900/30 border-4 border-yellow-500'
        ]"
      >
        <div class="text-5xl text-gray-300 mb-4">Time Remaining</div>
        <div
          :class="[
            'text-[12rem] font-bold leading-none',
            gameState.timer.remainingSeconds <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-300'
          ]"
        >
          {{ formatTime(gameState.timer.remainingSeconds) }}
        </div>
      </div>

      <!-- Next Up Preview -->
      <div v-if="nextCreature" class="next-up bg-gray-800/50 rounded-xl p-6 text-center">
        <div class="text-3xl text-gray-400 mb-2">Next Up</div>
        <div class="text-5xl font-bold text-blue-300">{{ nextCreature.name }}</div>
      </div>
    </div>

    <!-- Initiative Order List (Bottom) -->
    <div class="initiative-scroll bg-gray-900/80 p-6">
      <div class="flex gap-4 overflow-x-auto">
        <div
          v-for="(creature, index) in gameState.creatures"
          :key="creature.id"
          :class="[
            'creature-card flex-shrink-0 w-48 p-4 rounded-lg border-2',
            index === gameState.currentTurnIndex
              ? 'bg-green-900/30 border-green-500'
              : 'bg-gray-800 border-gray-600'
          ]"
        >
          <div class="text-3xl font-bold mb-1">{{ creature.name }}</div>
          <div class="text-xl text-gray-400">Init: {{ creature.initiative }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from './composables/useGameState';

const { gameState, connected } = useGameState();

const currentCreature = computed(() => {
  return gameState.value.creatures[gameState.value.currentTurnIndex];
});

const nextCreature = computed(() => {
  const nextIndex = (gameState.value.currentTurnIndex + 1) % gameState.value.creatures.length;
  return gameState.value.creatures[nextIndex];
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
```

#### **3.4 Update Composable for Pi** (`/web/pi-display/src/composables/useGameState.ts`)
Modify the connection URL to use environment variable:
```typescript
const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
socket.value = io(serverUrl);

// Change client identification
socket.value.emit('identify', { type: 'display', name: 'Pi Display' });
```

#### **3.5 Add Environment Config** (`/web/pi-display/.env.development`)
```
VITE_SERVER_URL=http://localhost:3001
```

#### **3.6 Test Pi Display**
- Start dev server: `cd web/pi-display && npm run dev`
- Open in separate browser window
- Verify it shows same state as DM console
- Test on large screen/TV if available

---

### **PHASE 4: Docker Integration ✅ MOSTLY COMPLETE (Pi Display Docker config missing)**

#### **4.1 Review Existing Docker Setup**
Examine `/infrastructure/docker-compose.dev.yml`

#### **4.2 Add Dockerfiles**

**Server Dockerfile** (`/server/Dockerfile`)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**DM Console Dockerfile** (`/web/dm-console/Dockerfile`)
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

**Pi Display Dockerfile** (`/web/pi-display/Dockerfile`)
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

#### **4.3 Update Docker Compose** (`/infrastructure/docker-compose.dev.yml`)
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  server:
    build:
      context: ../server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    volumes:
      - ../server:/app
      - /app/node_modules
    command: npm run dev

  dm-console:
    build:
      context: ../web/dm-console
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      - VITE_SERVER_URL=http://localhost:3001
    volumes:
      - ../web/dm-console:/app
      - /app/node_modules
    command: npm run dev

  pi-display:
    build:
      context: ../web/pi-display
      dockerfile: Dockerfile.dev
    ports:
      - "5174:5173"
    environment:
      - VITE_SERVER_URL=http://localhost:3001
    volumes:
      - ../web/pi-display:/app
      - /app/node_modules
    command: npm run dev

volumes:
  redis-data:
```

#### **4.4 Test Docker Setup**
```bash
cd infrastructure
docker-compose -f docker-compose.dev.yml up --build
```

Verify all services start and can communicate.

---

### **PHASE 5: Testing & Validation ⚠️ PARTIAL (test files exist, not fully run)**

#### **5.1 Manual Integration Test**
Create test script (`/tests/manual-test-plan.md`):
```markdown
# Manual Test Plan - MVP

## Setup
1. Start all services: `docker-compose -f infrastructure/docker-compose.dev.yml up`
2. Open DM Console: http://localhost:5173
3. Open Pi Display: http://localhost:5174

## Test Cases

### TC-1: Add Creatures
- [ ] Add player "Gandalf", initiative 18
- [ ] Add monster "Goblin 1", initiative 15
- [ ] Add monster "Goblin 2", initiative 12
- [ ] Verify all appear in initiative list (sorted by initiative)
- [ ] Verify Pi display shows same creatures

### TC-2: Turn Advancement
- [ ] Verify Gandalf (init 18) is highlighted as current turn
- [ ] Click "Next Turn" on DM console
- [ ] Verify Goblin 1 (init 15) becomes current turn
- [ ] Verify round counter = 1
- [ ] Click "Next Turn" twice more
- [ ] Verify round counter advances to 2
- [ ] Verify turn wraps back to Gandalf
- [ ] Verify Pi display shows correct current turn

### TC-3: Timer Functionality
- [ ] Click "30s" timer button
- [ ] Verify timer shows 0:30 and counts down
- [ ] Verify Pi display shows timer countdown
- [ ] Verify timer updates every second
- [ ] Wait for timer to reach 0:10
- [ ] Verify Pi display shows red/pulsing warning
- [ ] Click "Stop Timer"
- [ ] Verify timer stops and disappears

### TC-4: Remove Creatures
- [ ] Remove "Goblin 2" from initiative
- [ ] Verify it disappears from list
- [ ] Verify turn order adjusts correctly
- [ ] Verify Pi display updates

### TC-5: Session Reset
- [ ] Click "Reset Session"
- [ ] Confirm dialog
- [ ] Verify all creatures removed
- [ ] Verify round resets to 1
- [ ] Verify Pi display clears

### TC-6: Reconnection Handling
- [ ] Stop server: `docker-compose stop server`
- [ ] Verify DM console shows "Disconnected"
- [ ] Verify Pi display shows connection warning
- [ ] Restart server: `docker-compose start server`
- [ ] Verify both clients reconnect automatically
- [ ] Verify state is restored

## Success Criteria
All test cases pass without errors.
```

#### **5.2 Create Automated Test** (`/server/src/__tests__/integration.test.ts`)
```typescript
import { io as Client, Socket } from 'socket.io-client';
import { server } from '../index';
import type { GameState } from '../types';

describe('Integration Tests', () => {
  let clientSocket: Socket;
  let serverPort: number;

  beforeAll((done) => {
    serverPort = 3002; // Use different port for tests
    server.listen(serverPort, () => {
      done();
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${serverPort}`);
    clientSocket.on('connect', () => {
      clientSocket.emit('identify', { type: 'dm', name: 'Test DM' });
      done();
    });
  });

  afterEach(() => {
    clientSocket.disconnect();
  });

  test('should receive initial state on connection', (done) => {
    clientSocket.emit('state:request');
    clientSocket.on('state:update', (state: GameState) => {
      expect(state).toHaveProperty('creatures');
      expect(state).toHaveProperty('currentTurnIndex');
      expect(state).toHaveProperty('currentRound');
      done();
    });
  });

  test('should add creature and broadcast state', (done) => {
    const creature = {
      id: 'test-1',
      name: 'Test Creature',
      initiative: 15,
      type: 'monster' as const
    };

    clientSocket.on('state:update', (state: GameState) => {
      const added = state.creatures.find(c => c.id === 'test-1');
      if (added) {
        expect(added.name).toBe('Test Creature');
        expect(added.initiative).toBe(15);
        done();
      }
    });

    clientSocket.emit('creature:add', creature);
  });

  test('should advance turn and increment round', (done) => {
    let updateCount = 0;
    const creatures = [
      { id: 'c1', name: 'C1', initiative: 20, type: 'monster' as const },
      { id: 'c2', name: 'C2', initiative: 15, type: 'monster' as const }
    ];

    clientSocket.on('state:update', (state: GameState) => {
      updateCount++;

      // After adding both creatures
      if (updateCount === 2) {
        clientSocket.emit('turn:next');
      }

      // After first turn advance
      if (updateCount === 3) {
        expect(state.currentTurnIndex).toBe(1);
        expect(state.currentRound).toBe(1);
        clientSocket.emit('turn:next');
      }

      // After wrapping to next round
      if (updateCount === 4) {
        expect(state.currentTurnIndex).toBe(0);
        expect(state.currentRound).toBe(2);
        done();
      }
    });

    creatures.forEach(c => clientSocket.emit('creature:add', c));
  });
});
```

Run tests:
```bash
cd server
npm test
```

---

### **PHASE 6: Documentation & Cleanup ⚠️ PARTIAL**

#### **6.1 Update README** (`/README.md`)
Add "Quick Start" section:
```markdown
## Quick Start (MVP)

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Development Setup

1. Clone repository
2. Start all services:
   ```bash
   cd infrastructure
   docker-compose -f docker-compose.dev.yml up
   ```

3. Access interfaces:
   - DM Console: http://localhost:5173
   - Pi Display: http://localhost:5174
   - Server Health: http://localhost:3001/health

### Manual Setup (without Docker)

**Terminal 1 - Server:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - DM Console:**
```bash
cd web/dm-console
npm install
npm run dev
```

**Terminal 3 - Pi Display:**
```bash
cd web/pi-display
npm install
npm run dev
```

### Testing
- Manual test plan: `/tests/manual-test-plan.md`
- Automated tests: `cd server && npm test`
```

#### **6.2 Create Implementation Status Doc** (`/docs/implementation-status.md`)
```markdown
# Implementation Status

## MVP (Phase 1) - ✅ COMPLETE

### Backend Server
- [x] StateManager with turn/timer logic
- [x] TimerManager with 1s tick
- [x] WebSocket event handlers (all MVP events)
- [x] Input validation
- [x] Error handling and logging
- [x] Health check endpoint

### DM Console Frontend
- [x] Initiative list display
- [x] Add/remove creatures
- [x] Turn advancement controls
- [x] Timer controls (start/stop, presets)
- [x] Session reset
- [x] Real-time WebSocket sync
- [x] Responsive Tailwind UI

### Pi Display Frontend
- [x] Large-format initiative display
- [x] Current turn highlighting
- [x] Timer countdown (with urgency styling)
- [x] Next-up preview
- [x] Scrolling initiative list
- [x] Auto-reconnection handling

### Infrastructure
- [x] Docker Compose development environment
- [x] Multi-service orchestration (Redis, Server, 2x Web)
- [x] Hot-reload for development

### Testing
- [x] Manual test plan
- [x] Integration tests for core flows
- [x] End-to-end validation

## Phase 2 - 🔲 NOT STARTED
- [ ] Redis persistence integration
- [ ] Session save/restore
- [ ] Drag-and-drop initiative reordering
- [ ] ESP32 firmware
- [ ] Production deployment config

## Known Issues / TODOs
- Timer tick may drift over long durations (needs server-side timestamp sync)
- No authentication/authorization (planned for Phase 2)
- No state recovery on page refresh (needs Redis)
- Pi Display not optimized for specific screen sizes yet
```

#### **6.3 Add Code Comments**
Add JSDoc comments to key functions in StateManager, handlers, and components.

---

## **Success Criteria**

Your implementation is complete when:

✅ **Server runs without errors** and logs connections/state changes
✅ **DM Console can**:
  - Add creatures with name, initiative, type
  - Remove creatures
  - Advance turns with automatic round tracking
  - Start/stop timers with real-time countdown
  - Reset entire session

✅ **Pi Display shows**:
  - Current turn in large readable text
  - Round counter
  - Timer countdown (with urgency warning < 10s)
  - Full initiative order at bottom
  - Auto-updates when DM makes changes

✅ **All services run via Docker Compose** with single command
✅ **Manual test plan passes** all 6 test cases
✅ **Integration tests pass** (`npm test` in server/)
✅ **Reconnection works** - clients auto-reconnect after server restart

---

## **Key Technical Requirements**

### **Performance**
- WebSocket messages < 50ms latency on local network
- Timer ticks must be smooth (1 second precision)
- UI updates < 100ms after state change

### **Data Validation**
- Creature names: 1-50 characters, required
- Initiative: 1-30 (integer), required
- Timer duration: 1-3600 seconds
- All events validated before state mutation

### **Error Handling**
- Server errors emit `error` event to client
- Client shows error banner for 5 seconds
- Invalid inputs show validation messages
- Disconnection shows prominent warning

### **Code Quality**
- TypeScript strict mode (no `any` types)
- ESLint/Prettier formatting
- Meaningful variable/function names
- JSDoc comments on complex logic

---

## **Common Pitfalls to Avoid**

❌ **Don't hard-code URLs** - Use environment variables
❌ **Don't mutate state directly** - Always go through StateManager
❌ **Don't skip validation** - Validate all inputs before state change
❌ **Don't forget error handling** - Wrap all event handlers in try-catch
❌ **Don't ignore disconnections** - Handle reconnection gracefully
❌ **Don't use `any` types** - Properly type all data structures
❌ **Don't skip testing** - Run manual tests before considering done

---

## **Debugging Tips**

1. **WebSocket not connecting**: Check CORS settings, verify server URL
2. **State not updating**: Check browser console for errors, verify event names match
3. **Timer not ticking**: Check TimerManager is started, verify setInterval running
4. **Docker services fail**: Check ports aren't in use, verify Dockerfile paths
5. **Types errors**: Ensure types/ are identical between server and clients

---

## **Deliverable Checklist**

Before submitting your MVP implementation:

- [ ] All code committed to git with meaningful commit messages
- [ ] README.md updated with quick start instructions
- [ ] Implementation status document created
- [ ] Manual test plan executed and passing
- [ ] Automated tests written and passing
- [ ] Docker Compose starts all services successfully
- [ ] DM Console fully functional with all controls
- [ ] Pi Display shows initiative in large format
- [ ] Timer counts down accurately
- [ ] Reconnection handling works
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] Key functions have JSDoc comments

---

## **Estimated Timeline**

- **Phase 1 (Backend)**: 2-3 hours
- **Phase 2 (DM Console)**: 4-5 hours
- **Phase 3 (Pi Display)**: 3-4 hours
- **Phase 4 (Docker)**: 1-2 hours
- **Phase 5 (Testing)**: 2-3 hours
- **Phase 6 (Documentation)**: 1 hour

**Total: 13-18 hours** for complete MVP

---

## **Reference Documentation**

You have access to these docs in the repository:
- `/docs/architecture/system-architecture.md` - Complete system design
- `/docs/api/websocket-events.md` - Full event protocol (30+ events)
- `/docs/requirements/technical-requirements.md` - All requirements
- `/docs/implementation.md` - 4-phase roadmap
- `/CLAUDE.md` - Project overview
- `/server/src/` - Existing server code (40% complete)

**Read these first before starting implementation.**

---

## **Final Notes**

This is an **MVP** - focus on core functionality over polish. The goal is a **working demo** that proves the concept. Advanced features (drag-and-drop, session save/restore, ESP32 devices) come in Phase 2.

Your code will be deployed on a Raspberry Pi and used in real tabletop gaming sessions. Prioritize:
1. **Reliability** - Must work every time
2. **Simplicity** - Easy to understand and debug
3. **Performance** - Smooth real-time updates
4. **Extensibility** - Easy to add Phase 2 features

**Good luck building the MVP! 🎲**
