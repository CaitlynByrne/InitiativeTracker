# **Initiative Tracker - Phase 2 Implementation Plan (v1.0)**

## **🎯 PHASE 2 OVERVIEW**

**Goal:** Enhance the production-ready MVP with professional UI/UX improvements, session management, creature editing, image support, and monitoring capabilities.

**Timeline:** 3-4 weeks

**Scope:** Web-only (DM Console + Pi Display). ESP32 hardware deferred to v2.0.

---

## **📋 PHASE 2 FEATURE LIST**

### **Included in Phase 2 (v1.0):**
1. Manual Session Save/Restore UI
2. Drag-and-Drop Initiative Reordering
3. Creature Editing (Initiative, HP, Name)
4. Creature Avatar Images
5. Condition/Effect Tracking
6. Turn History & Undo
7. Enhanced Pi Display Typography
8. UI/UX Improvements
9. System Monitoring Dashboard
10. Advanced Timer Features

### **Deferred to v2.0:**
- ESP32 Player Devices
- Hardware integration
- Mobile native apps
- VTT integration

---

## **DETAILED IMPLEMENTATION TASKS**

---

## **TASK 1: Manual Session Save/Restore UI** (~3 hours)

**Priority:** High
**Dependencies:** Backend session:save/restore events already complete

### **1.1 Update Creature Type Definition**
**File:** `server/src/types/index.ts` and `web/dm-console/src/types/index.ts`

Add `imageUrl` field to Creature interface:
```typescript
export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'npc' | 'monster';
  hp?: number;
  maxHp?: number;
  conditions?: string[];
  imageUrl?: string;  // NEW: URL or data URI for creature avatar
}
```

### **1.2 Create SessionManager Component**
**File:** `web/dm-console/src/components/SessionManager.vue`

```vue
<template>
  <div class="session-manager bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Session Management</h2>

    <!-- Save Session -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">Save Current Session</label>
      <div class="flex gap-2">
        <input
          v-model="sessionName"
          type="text"
          placeholder="Session name (e.g., 'Chapter 3 - Dragon Fight')"
          class="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          @keyup.enter="handleSave"
        />
        <button
          @click="handleSave"
          :disabled="!sessionName.trim() || saving"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors whitespace-nowrap"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- Saved Sessions List -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-300">Saved Sessions</label>
        <button
          @click="loadSessions"
          class="text-sm text-blue-400 hover:text-blue-300"
        >
          Refresh
        </button>
      </div>

      <div v-if="loading" class="text-gray-400 text-sm">Loading sessions...</div>

      <div v-else-if="sessions.length === 0" class="text-gray-400 text-sm">
        No saved sessions yet
      </div>

      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="session in sessions"
          :key="session.name"
          class="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
          <div class="flex-1">
            <div class="font-bold text-white">{{ session.name }}</div>
            <div class="text-xs text-gray-400">
              {{ formatDate(session.timestamp) }} •
              {{ session.creatureCount }} creatures •
              Round {{ session.round }}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="handleRestore(session.name)"
              class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Load
            </button>
            <button
              @click="handleDelete(session.name)"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Save Info -->
    <div class="text-xs text-gray-400 border-t border-gray-700 pt-3 mt-3">
      <p><strong>Auto-save:</strong> Your session is automatically saved every time you make changes.</p>
      <p class="mt-1"><strong>Manual save:</strong> Create named snapshots you can restore later.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface SavedSession {
  name: string;
  timestamp: string;
  creatureCount: number;
  round: number;
}

const emit = defineEmits<{
  (e: 'save', name: string): void;
  (e: 'restore', name: string): void;
  (e: 'delete', name: string): void;
}>();

const sessionName = ref('');
const sessions = ref<SavedSession[]>([]);
const loading = ref(false);
const saving = ref(false);

const loadSessions = async () => {
  loading.value = true;
  emit('list');
  // Sessions will be updated via props or event from parent
};

const handleSave = () => {
  if (!sessionName.value.trim()) return;
  saving.value = true;
  emit('save', sessionName.value.trim());
  sessionName.value = '';
  setTimeout(() => {
    saving.value = false;
    loadSessions();
  }, 500);
};

const handleRestore = (name: string) => {
  if (confirm(`Load session "${name}"? This will replace your current combat.`)) {
    emit('restore', name);
  }
};

const handleDelete = (name: string) => {
  if (confirm(`Delete session "${name}"? This cannot be undone.`)) {
    emit('delete', name);
    loadSessions();
  }
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  loadSessions();
});

defineExpose({
  updateSessions: (newSessions: SavedSession[]) => {
    sessions.value = newSessions;
    loading.value = false;
  }
});
</script>
```

### **1.3 Update useGameState Composable**
**File:** `web/dm-console/src/composables/useGameState.ts`

Add session management methods:
```typescript
// Add to existing useGameState composable

const savedSessions = ref<any[]>([]);

const saveSession = (name: string) => {
  socket.value?.emit('session:save', { name }, (response: any) => {
    if (response.success) {
      console.log('Session saved:', name);
    } else {
      error.value = response.error || 'Failed to save session';
      setTimeout(() => error.value = null, 5000);
    }
  });
};

const restoreSession = (name: string) => {
  socket.value?.emit('session:restore', { name }, (response: any) => {
    if (response.success) {
      console.log('Session restored:', name);
    } else {
      error.value = response.error || 'Failed to restore session';
      setTimeout(() => error.value = null, 5000);
    }
  });
};

const listSessions = () => {
  socket.value?.emit('session:list', (response: any) => {
    if (response.success) {
      savedSessions.value = response.sessions;
    }
  });
};

const deleteSession = (name: string) => {
  socket.value?.emit('session:delete', { name }, (response: any) => {
    if (response.success) {
      listSessions(); // Refresh list
    }
  });
};

// Add to return statement
return {
  // ... existing returns
  saveSession,
  restoreSession,
  listSessions,
  deleteSession,
  savedSessions
};
```

### **1.4 Implement Backend Session List/Delete**
**File:** `server/src/events/handlers.ts`

Add session list and delete handlers:
```typescript
// Add to registerEventHandlers function

socket.on('session:list', async (callback) => {
  try {
    const pattern = 'initiative:saved:*';
    const keys = await redisClient.keys(pattern);

    const sessions = await Promise.all(
      keys.map(async (key) => {
        const data = await redisClient.get(key);
        if (!data) return null;

        const state = JSON.parse(data);
        const name = key.replace('initiative:saved:', '');

        return {
          name,
          timestamp: state.metadata?.savedAt || new Date().toISOString(),
          creatureCount: state.creatures?.length || 0,
          round: state.currentRound || 1
        };
      })
    );

    const filteredSessions = sessions.filter(s => s !== null);
    callback({ success: true, sessions: filteredSessions });
  } catch (error) {
    logger.error('Error listing sessions:', error);
    callback({ success: false, error: error.message });
  }
});

socket.on('session:delete', async (data: { name: string }, callback) => {
  try {
    const key = `initiative:saved:${data.name}`;
    await redisClient.delete(key);
    logger.info(`Session deleted: ${data.name}`);
    callback({ success: true });
  } catch (error) {
    logger.error('Error deleting session:', error);
    callback({ success: false, error: error.message });
  }
});
```

### **1.5 Add SessionManager to DM Console Layout**
**File:** `web/dm-console/src/App.vue`

Add SessionManager component to a collapsible section or dedicated tab.

**Testing Checklist:**
- [ ] Save session with custom name
- [ ] List saved sessions shows metadata
- [ ] Restore session loads creatures and state
- [ ] Delete session removes from list
- [ ] Auto-save still works independently
- [ ] Error handling for failed saves/restores

---

## **TASK 2: Drag-and-Drop Initiative Reordering** (~4 hours)

**Priority:** High
**Dependencies:** Backend `initiative:reorder` event already complete

### **2.1 Install Vue Draggable**
**File:** `web/dm-console/package.json`

```bash
cd web/dm-console
npm install vuedraggable@next
```

### **2.2 Update InitiativeList Component**
**File:** `web/dm-console/src/components/InitiativeList.vue`

Replace static list with draggable list:
```vue
<template>
  <div class="initiative-list bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Initiative Order</h2>

    <div v-if="creatures.length === 0" class="text-gray-400 text-center py-8">
      No creatures in initiative. Add some to get started!
    </div>

    <draggable
      v-else
      v-model="localCreatures"
      item-key="id"
      @end="handleReorder"
      handle=".drag-handle"
      class="space-y-2"
      ghost-class="ghost"
      chosen-class="chosen"
      drag-class="dragging"
    >
      <template #item="{ element: creature, index }">
        <div
          :class="[
            'creature-card p-3 rounded border-2 transition-all cursor-move',
            index === currentTurnIndex
              ? 'border-green-500 bg-green-900/20'
              : 'border-gray-600 bg-gray-700'
          ]"
        >
          <div class="flex items-center justify-between">
            <!-- Drag Handle -->
            <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-200 pr-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
              </svg>
            </div>

            <div class="flex items-center gap-3 flex-1">
              <!-- Avatar Image (if exists) -->
              <img
                v-if="creature.imageUrl"
                :src="creature.imageUrl"
                :alt="creature.name"
                class="w-12 h-12 rounded object-cover"
              />

              <!-- Initiative Badge -->
              <div class="initiative-badge bg-blue-600 text-white font-bold px-3 py-1 rounded">
                {{ creature.initiative }}
              </div>

              <!-- Creature Info -->
              <div class="flex-1">
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
            <div v-if="creature.hp !== undefined" class="hp-display text-sm text-gray-300 mr-2">
              HP: {{ creature.hp }}/{{ creature.maxHp }}
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-1">
              <button
                @click="$emit('edit', creature.id)"
                class="edit-btn text-blue-400 hover:text-blue-300 px-2 py-1"
                title="Edit creature"
              >
                ✎
              </button>
              <button
                @click="$emit('remove', creature.id)"
                class="remove-btn text-red-400 hover:text-red-300 px-2 py-1"
                title="Remove creature"
              >
                ✕
              </button>
            </div>
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
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import draggable from 'vuedraggable';
import type { Creature } from '../types';

const props = defineProps<{
  creatures: Creature[];
  currentTurnIndex: number;
}>();

const emit = defineEmits<{
  (e: 'remove', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
}>();

const localCreatures = ref<Creature[]>([...props.creatures]);

// Sync local creatures with props
watch(() => props.creatures, (newCreatures) => {
  localCreatures.value = [...newCreatures];
}, { deep: true });

const handleReorder = (event: any) => {
  if (event.oldIndex !== event.newIndex) {
    emit('reorder', event.oldIndex, event.newIndex);
  }
};
</script>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #3b82f6;
}

.chosen {
  opacity: 0.8;
}

.dragging {
  opacity: 0.5;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
```

### **2.3 Wire Up Reorder in useGameState**
Already implemented - verify `reorderInitiative` function exists and emits `initiative:reorder` event.

**Testing Checklist:**
- [ ] Drag creatures up and down
- [ ] Current turn marker updates correctly
- [ ] Changes sync to Pi Display
- [ ] State persists after drag
- [ ] Touch-friendly on tablets

---

## **TASK 3: Creature Editing UI** (~6 hours)

**Priority:** High
**Dependencies:** Backend `creature:update` event

### **3.1 Implement Backend creature:update Event**
**File:** `server/src/events/handlers.ts`

```typescript
socket.on('creature:update', (data: { id: string; updates: Partial<Creature> }, callback) => {
  try {
    logger.info(`Updating creature: ${data.id}`, data.updates);

    const updatedCreature = stateManager.updateCreature(data.id, data.updates);

    // If initiative changed, re-sort
    if (data.updates.initiative !== undefined) {
      stateManager.sortCreatures();
    }

    io.emit('state:update', stateManager.getState());

    if (callback) callback({ success: true, creature: updatedCreature });
  } catch (error) {
    logger.error('Error updating creature:', error);
    socket.emit('error', {
      message: error.message,
      event: 'creature:update'
    });
    if (callback) callback({ success: false, error: error.message });
  }
});
```

### **3.2 Add sortCreatures Method to StateManager**
**File:** `server/src/state/StateManager.ts`

```typescript
public sortCreatures(): void {
  const currentCreature = this.state.creatures[this.state.currentTurnIndex];

  // Sort by initiative (descending)
  this.state.creatures.sort((a, b) => b.initiative - a.initiative);

  // Find new index of current creature
  if (currentCreature) {
    const newIndex = this.state.creatures.findIndex(c => c.id === currentCreature.id);
    if (newIndex !== -1) {
      this.state.currentTurnIndex = newIndex;
    }
  }

  this.emit('stateChanged', this.state);
}
```

### **3.3 Create EditCreatureModal Component**
**File:** `web/dm-console/src/components/EditCreatureModal.vue`

```vue
<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleCancel"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-2xl font-bold mb-4 text-white">Edit Creature</h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <!-- Initiative -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Initiative</label>
            <input
              v-model.number="form.initiative"
              type="number"
              required
              min="1"
              max="30"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <p class="text-xs text-gray-400 mt-1">Changing initiative will re-sort the list</p>
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              v-model="form.type"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="player">Player</option>
              <option value="npc">NPC</option>
              <option value="monster">Monster</option>
            </select>
          </div>

          <!-- HP & Max HP -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Current HP</label>
              <input
                v-model.number="form.hp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Max HP</label>
              <input
                v-model.number="form.maxHp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Image URL -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Avatar Image
              <span class="text-xs text-gray-400">(URL or upload)</span>
            </label>
            <div class="space-y-2">
              <input
                v-model="form.imageUrl"
                type="text"
                placeholder="https://example.com/image.jpg"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <img
                v-if="form.imageUrl"
                :src="form.imageUrl"
                alt="Preview"
                class="w-16 h-16 rounded object-cover"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="handleCancel"
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { Creature } from '../types';

const props = defineProps<{
  isOpen: boolean;
  creature: Creature | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', id: string, updates: Partial<Creature>): void;
}>();

const form = reactive({
  name: '',
  initiative: 10,
  type: 'monster' as 'player' | 'npc' | 'monster',
  hp: undefined as number | undefined,
  maxHp: undefined as number | undefined,
  imageUrl: ''
});

watch(() => props.creature, (newCreature) => {
  if (newCreature) {
    form.name = newCreature.name;
    form.initiative = newCreature.initiative;
    form.type = newCreature.type;
    form.hp = newCreature.hp;
    form.maxHp = newCreature.maxHp;
    form.imageUrl = newCreature.imageUrl || '';
  }
}, { immediate: true });

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Convert to data URI (or upload to server)
  const reader = new FileReader();
  reader.onload = (e) => {
    form.imageUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const handleSubmit = () => {
  if (!props.creature) return;

  const updates: Partial<Creature> = {
    name: form.name,
    initiative: form.initiative,
    type: form.type,
    hp: form.hp,
    maxHp: form.maxHp,
    imageUrl: form.imageUrl || undefined
  };

  emit('save', props.creature.id, updates);
  emit('close');
};

const handleCancel = () => {
  emit('close');
};
</script>
```

### **3.4 Add Edit Functionality to DM Console**
**File:** `web/dm-console/src/App.vue`

```vue
<!-- Add to template -->
<EditCreatureModal
  :is-open="editingCreature !== null"
  :creature="editingCreature"
  @close="editingCreature = null"
  @save="updateCreature"
/>

<!-- Add to script -->
<script setup lang="ts">
const editingCreature = ref<Creature | null>(null);

const handleEditCreature = (id: string) => {
  editingCreature.value = gameState.value.creatures.find(c => c.id === id) || null;
};

const updateCreature = (id: string, updates: Partial<Creature>) => {
  socket.value?.emit('creature:update', { id, updates });
};
</script>
```

### **3.5 Add updateCreature to useGameState**
**File:** `web/dm-console/src/composables/useGameState.ts`

```typescript
const updateCreature = (id: string, updates: Partial<Creature>) => {
  socket.value?.emit('creature:update', { id, updates });
};

// Add to return
return {
  // ... existing
  updateCreature
};
```

**Testing Checklist:**
- [ ] Edit creature name, initiative, HP
- [ ] Initiative change re-sorts list
- [ ] Current turn preserved after edit
- [ ] Changes sync to Pi Display
- [ ] Image upload converts to data URI
- [ ] Image URL works from external source

---

## **TASK 4: Creature Avatar Images** (~4 hours)

**Priority:** Medium
**Dependencies:** Task 3 (Edit UI), Image upload/storage

### **4.1 Image Resizing Utility**
**File:** `web/dm-console/src/utils/imageResize.ts`

```typescript
export async function resizeImage(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
```

### **4.2 Update EditCreatureModal to Use Resize**
**File:** `web/dm-console/src/components/EditCreatureModal.vue`

```typescript
import { resizeImage } from '../utils/imageResize';

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    // Resize and convert to data URI
    const resizedDataUri = await resizeImage(file, 200, 200);
    form.imageUrl = resizedDataUri;
  } catch (error) {
    console.error('Failed to resize image:', error);
    // Fallback to original file
    const reader = new FileReader();
    reader.onload = (e) => {
      form.imageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};
```

### **4.3 Update Pi Display to Show Images**
**File:** `web/pi-display/src/App.vue`

Add avatar to current turn and initiative list displays:
```vue
<!-- Current Turn Display -->
<div class="current-creature">
  <img
    v-if="currentCreature.imageUrl"
    :src="currentCreature.imageUrl"
    :alt="currentCreature.name"
    class="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover mb-4 border-4 border-white shadow-lg"
  />
  <div class="text-6xl lg:text-8xl font-bold">{{ currentCreature.name }}</div>
</div>

<!-- Initiative List -->
<div v-for="creature in gameState.creatures" :key="creature.id">
  <img
    v-if="creature.imageUrl"
    :src="creature.imageUrl"
    :alt="creature.name"
    class="w-8 h-8 rounded object-cover"
  />
  <!-- ... rest of creature display -->
</div>
```

**Testing Checklist:**
- [ ] Upload image, verify resized to 200x200 max
- [ ] Image displays in initiative list (DM Console)
- [ ] Image displays on Pi Display
- [ ] Large images are compressed
- [ ] Image persists across sessions
- [ ] No image shows gracefully (no broken icon)

---

## **TASK 5: Condition/Effect Tracking** (~8 hours)

**Priority:** High
**Dependencies:** Creature editing UI

### **5.1 Define Standard D&D 5e Conditions**
**File:** `server/src/types/conditions.ts`

```typescript
export const DND5E_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Concentrating',
  'Blessed',
  'Cursed',
  'Hasted',
  'Slowed'
] as const;

export type Condition = typeof DND5E_CONDITIONS[number];

export interface ConditionEffect {
  condition: Condition;
  duration?: number; // rounds remaining, undefined = until removed
  source?: string; // spell/ability name
  addedAt: string; // ISO timestamp
}
```

### **5.2 Update Creature Type**
**File:** `server/src/types/index.ts`

```typescript
import { ConditionEffect } from './conditions';

export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'npc' | 'monster';
  hp?: number;
  maxHp?: number;
  conditions?: string[]; // DEPRECATED: for backward compatibility
  conditionEffects?: ConditionEffect[]; // NEW
  imageUrl?: string;
}
```

### **5.3 Create ConditionSelector Component**
**File:** `web/dm-console/src/components/ConditionSelector.vue`

```vue
<template>
  <div class="condition-selector">
    <label class="block text-sm font-medium text-gray-300 mb-2">Conditions</label>

    <!-- Selected Conditions -->
    <div v-if="modelValue && modelValue.length > 0" class="flex flex-wrap gap-2 mb-3">
      <div
        v-for="(effect, index) in modelValue"
        :key="index"
        class="flex items-center gap-2 bg-yellow-800 text-yellow-200 px-3 py-1 rounded-lg"
      >
        <span class="font-medium">{{ effect.condition }}</span>
        <span v-if="effect.duration" class="text-xs opacity-75">{{ effect.duration }}r</span>
        <button
          @click="removeCondition(index)"
          class="hover:text-yellow-100"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Add Condition -->
    <div class="flex gap-2">
      <select
        v-model="selectedCondition"
        class="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="">Select condition...</option>
        <option v-for="condition in availableConditions" :key="condition" :value="condition">
          {{ condition }}
        </option>
      </select>

      <input
        v-model.number="duration"
        type="number"
        min="1"
        placeholder="Rounds"
        class="w-24 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />

      <button
        @click="addCondition"
        :disabled="!selectedCondition"
        type="button"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
      >
        Add
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ConditionEffect } from '../types/conditions';

const DND5E_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
  'Concentrating', 'Blessed', 'Cursed', 'Hasted', 'Slowed'
];

const props = defineProps<{
  modelValue?: ConditionEffect[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: ConditionEffect[]): void;
}>();

const selectedCondition = ref('');
const duration = ref<number | undefined>(undefined);

const availableConditions = computed(() => {
  const current = props.modelValue?.map(e => e.condition) || [];
  return DND5E_CONDITIONS.filter(c => !current.includes(c));
});

const addCondition = () => {
  if (!selectedCondition.value) return;

  const newEffect: ConditionEffect = {
    condition: selectedCondition.value as any,
    duration: duration.value,
    addedAt: new Date().toISOString()
  };

  const updated = [...(props.modelValue || []), newEffect];
  emit('update:modelValue', updated);

  selectedCondition.value = '';
  duration.value = undefined;
};

const removeCondition = (index: number) => {
  const updated = [...(props.modelValue || [])];
  updated.splice(index, 1);
  emit('update:modelValue', updated);
};
</script>
```

### **5.4 Add Condition Tracking to EditCreatureModal**
**File:** `web/dm-console/src/components/EditCreatureModal.vue`

```vue
<!-- Add after Image URL section -->
<ConditionSelector v-model="form.conditionEffects" />
```

### **5.5 Implement Condition Duration Decrement on Turn Advance**
**File:** `server/src/state/StateManager.ts`

```typescript
public nextTurn(): void {
  this.state.currentTurnIndex++;

  if (this.state.currentTurnIndex >= this.state.creatures.length) {
    this.state.currentTurnIndex = 0;
    this.state.currentRound++;
  }

  // Decrement condition durations for current creature
  const currentCreature = this.state.creatures[this.state.currentTurnIndex];
  if (currentCreature && currentCreature.conditionEffects) {
    currentCreature.conditionEffects = currentCreature.conditionEffects
      .map(effect => {
        if (effect.duration !== undefined && effect.duration > 0) {
          return { ...effect, duration: effect.duration - 1 };
        }
        return effect;
      })
      .filter(effect => effect.duration === undefined || effect.duration > 0);
  }

  this.emit('stateChanged', this.state);
  this.saveToRedis();
}
```

### **5.6 Display Conditions on Pi Display**
**File:** `web/pi-display/src/App.vue`

```vue
<!-- Add to current creature display -->
<div v-if="currentCreature.conditionEffects && currentCreature.conditionEffects.length > 0"
     class="mt-4 flex flex-wrap gap-2 justify-center">
  <div
    v-for="effect in currentCreature.conditionEffects"
    :key="effect.condition"
    class="bg-yellow-600 text-white px-4 py-2 rounded-lg text-lg font-bold"
  >
    {{ effect.condition }}
    <span v-if="effect.duration" class="text-sm ml-1">({{ effect.duration }}r)</span>
  </div>
</div>
```

**Testing Checklist:**
- [ ] Add condition to creature
- [ ] Condition displays in DM Console
- [ ] Condition displays on Pi Display
- [ ] Duration decrements on turn advance
- [ ] Condition removed when duration reaches 0
- [ ] Multiple conditions supported
- [ ] Conditions persist across sessions

---

## **TASK 6: Turn History & Undo** (~6 hours)

**Priority:** Medium
**Dependencies:** None

### **6.1 Add History to StateManager**
**File:** `server/src/state/StateManager.ts`

```typescript
interface StateSnapshot {
  state: GameState;
  timestamp: string;
  action: string; // "turn_advance", "creature_added", etc.
}

export class StateManager extends EventEmitter {
  private history: StateSnapshot[] = [];
  private maxHistory: number = 10;

  private saveSnapshot(action: string): void {
    const snapshot: StateSnapshot = {
      state: JSON.parse(JSON.stringify(this.state)), // deep clone
      timestamp: new Date().toISOString(),
      action
    };

    this.history.push(snapshot);

    // Keep only last N snapshots
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  public undo(): GameState | null {
    if (this.history.length === 0) {
      return null;
    }

    const snapshot = this.history.pop();
    if (!snapshot) return null;

    this.state = snapshot.state;
    this.emit('stateChanged', this.state);
    this.saveToRedis();

    return this.state;
  }

  public getHistory(): StateSnapshot[] {
    return this.history.map(s => ({
      ...s,
      state: undefined as any // Don't send full state, just metadata
    }));
  }

  // Update existing methods to save snapshots
  public nextTurn(): void {
    this.saveSnapshot('turn_advance');
    // ... existing nextTurn logic
  }

  public addCreature(creature: Creature): void {
    this.saveSnapshot('creature_added');
    // ... existing addCreature logic
  }

  public removeCreature(id: string): void {
    this.saveSnapshot('creature_removed');
    // ... existing removeCreature logic
  }
}
```

### **6.2 Add Undo Event Handler**
**File:** `server/src/events/handlers.ts`

```typescript
socket.on('state:undo', (callback) => {
  try {
    const previousState = stateManager.undo();

    if (previousState) {
      io.emit('state:update', previousState);
      logger.info('State reverted via undo');
      if (callback) callback({ success: true });
    } else {
      const message = 'No history available to undo';
      logger.warn(message);
      if (callback) callback({ success: false, message });
    }
  } catch (error) {
    logger.error('Error during undo:', error);
    if (callback) callback({ success: false, error: error.message });
  }
});

socket.on('state:history', (callback) => {
  try {
    const history = stateManager.getHistory();
    if (callback) callback({ success: true, history });
  } catch (error) {
    logger.error('Error getting history:', error);
    if (callback) callback({ success: false, error: error.message });
  }
});
```

### **6.3 Add Undo Button to DM Console**
**File:** `web/dm-console/src/components/ControlPanel.vue`

```vue
<!-- Add after Next Turn button -->
<button
  @click="$emit('undo')"
  class="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
>
  ↶ Undo Last Action
</button>

<!-- Add to emits -->
defineEmits<{
  (e: 'nextTurn'): void;
  (e: 'startTimer', seconds: number): void;
  (e: 'stopTimer'): void;
  (e: 'reset'): void;
  (e: 'undo'): void; // NEW
}>();
```

### **6.4 Wire Up Undo in useGameState**
**File:** `web/dm-console/src/composables/useGameState.ts`

```typescript
const undo = () => {
  socket.value?.emit('state:undo', (response: any) => {
    if (!response.success) {
      error.value = response.message || 'Nothing to undo';
      setTimeout(() => error.value = null, 3000);
    }
  });
};

// Add to return
return {
  // ... existing
  undo
};
```

**Testing Checklist:**
- [ ] Undo after turn advance
- [ ] Undo after creature added
- [ ] Undo after creature removed
- [ ] Cannot undo when no history
- [ ] Undo syncs to Pi Display
- [ ] History limited to last 10 actions

---

## **TASK 7: Enhanced Pi Display Typography** (~2 hours)

**Priority:** Medium
**Dependencies:** None

### **7.1 Increase Font Sizes in Landscape Mode**
**File:** `web/pi-display/src/App.vue`

Update landscape mode styles:
```vue
<style scoped>
/* Landscape Mode (TV) */
@media (orientation: landscape) {
  .current-creature .name {
    font-size: 8rem; /* Increased from 6rem */
    line-height: 1.1;
  }

  .current-creature .initiative-badge {
    font-size: 6rem; /* Increased from 4rem */
    padding: 1.5rem 2rem;
  }

  .next-up {
    font-size: 3rem; /* Increased from 2rem */
  }

  .initiative-list .creature-item {
    font-size: 2.5rem; /* Increased from 1.75rem */
    padding: 1.5rem;
  }

  .timer-display {
    font-size: 7rem; /* Increased from 5rem */
  }
}

/* Ensure text is crisp and readable */
.current-creature,
.initiative-list,
.timer-display {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
</style>
```

### **7.2 Add Better Contrast and Shadows**
```vue
<style scoped>
.current-creature .name {
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
}

.initiative-badge {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
}

.creature-item {
  border: 3px solid rgba(255, 255, 255, 0.2);
}
</style>
```

**Testing Checklist:**
- [ ] Test on 1080p TV
- [ ] Test on 4K TV
- [ ] Verify readability from 10 feet
- [ ] Check text doesn't overflow
- [ ] Verify colors have good contrast

---

## **TASK 8: UI/UX Improvements** (~8 hours)

**Priority:** Medium
**Dependencies:** Multiple

### **8.1 Keyboard Shortcuts**
**File:** `web/dm-console/src/composables/useKeyboardShortcuts.ts`

```typescript
import { onMounted, onUnmounted } from 'vue';

export function useKeyboardShortcuts(handlers: {
  nextTurn?: () => void;
  undo?: () => void;
  save?: () => void;
  timer30?: () => void;
  timer60?: () => void;
  timer120?: () => void;
}) {
  const handleKeyPress = (event: KeyboardEvent) => {
    // Don't trigger if typing in input
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Next Turn: Space or N
    if (event.code === 'Space' || event.key === 'n') {
      event.preventDefault();
      handlers.nextTurn?.();
    }

    // Undo: Ctrl+Z or Cmd+Z
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      handlers.undo?.();
    }

    // Save: Ctrl+S or Cmd+S
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handlers.save?.();
    }

    // Timer shortcuts: 1, 2, 3
    if (event.key === '1') handlers.timer30?.();
    if (event.key === '2') handlers.timer60?.();
    if (event.key === '3') handlers.timer120?.();
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
  });
}
```

### **8.2 Add Keyboard Shortcuts to DM Console**
**File:** `web/dm-console/src/App.vue`

```typescript
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';

useKeyboardShortcuts({
  nextTurn,
  undo,
  save: () => console.log('Quick save'),
  timer30: () => startTimer(30),
  timer60: () => startTimer(60),
  timer120: () => startTimer(120)
});
```

### **8.3 Add Confirmation Dialogs**
**File:** `web/dm-console/src/components/ConfirmDialog.vue`

```vue
<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleCancel"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-xl font-bold mb-4 text-white">{{ title }}</h2>
        <p class="text-gray-300 mb-6">{{ message }}</p>

        <div class="flex gap-3">
          <button
            @click="handleCancel"
            class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleConfirm"
            :class="[
              'flex-1 font-bold py-2 px-4 rounded transition-colors',
              destructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            ]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  destructive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const handleConfirm = () => emit('confirm');
const handleCancel = () => emit('cancel');
</script>
```

### **8.4 Toast Notifications**
**File:** `web/dm-console/src/components/ToastNotification.vue`

```vue
<template>
  <teleport to="body">
    <transition name="toast">
      <div
        v-if="visible"
        :class="[
          'fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3',
          typeClass
        ]"
      >
        <span class="text-2xl">{{ icon }}</span>
        <span class="font-medium">{{ message }}</span>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}>();

const typeClass = computed(() => {
  switch (props.type) {
    case 'success': return 'bg-green-600 text-white';
    case 'error': return 'bg-red-600 text-white';
    case 'warning': return 'bg-yellow-600 text-white';
    default: return 'bg-blue-600 text-white';
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    default: return 'ℹ';
  }
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
```

### **8.5 Loading States**
**File:** `web/dm-console/src/components/LoadingSpinner.vue`

```vue
<template>
  <div class="flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
</template>
```

**Testing Checklist:**
- [ ] Keyboard shortcuts work
- [ ] Confirmation dialogs prevent accidents
- [ ] Toast notifications appear and disappear
- [ ] Loading states show during operations
- [ ] Accessibility (ARIA labels, focus management)

---

## **TASK 9: System Monitoring Dashboard** (~6 hours)

**Priority:** Low
**Dependencies:** None

### **9.1 Add System Stats Endpoint**
**File:** `server/src/index.ts`

```typescript
app.get('/api/stats', (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connectedClients: io.engine.clientsCount,
    currentRound: stateManager.getState().currentRound,
    creatureCount: stateManager.getState().creatures.length,
    timerActive: stateManager.getState().timer?.isActive || false
  };
  res.json(stats);
});

app.get('/api/clients', (req, res) => {
  const clients: any[] = [];
  io.sockets.sockets.forEach((socket) => {
    clients.push({
      id: socket.id,
      type: (socket as any).clientType || 'unknown',
      connectedAt: (socket as any).connectedAt || new Date().toISOString()
    });
  });
  res.json({ clients });
});
```

### **9.2 Create Stats Dashboard Component**
**File:** `web/dm-console/src/components/StatsDashboard.vue`

```vue
<template>
  <div class="stats-dashboard bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">System Status</h2>

    <div class="grid grid-cols-2 gap-4">
      <div class="stat-card bg-gray-700 p-3 rounded">
        <div class="text-gray-400 text-sm">Uptime</div>
        <div class="text-white text-2xl font-bold">{{ formatUptime(stats.uptime) }}</div>
      </div>

      <div class="stat-card bg-gray-700 p-3 rounded">
        <div class="text-gray-400 text-sm">Connected Clients</div>
        <div class="text-white text-2xl font-bold">{{ stats.connectedClients }}</div>
      </div>

      <div class="stat-card bg-gray-700 p-3 rounded">
        <div class="text-gray-400 text-sm">Current Round</div>
        <div class="text-white text-2xl font-bold">{{ stats.currentRound }}</div>
      </div>

      <div class="stat-card bg-gray-700 p-3 rounded">
        <div class="text-gray-400 text-sm">Creatures</div>
        <div class="text-white text-2xl font-bold">{{ stats.creatureCount }}</div>
      </div>
    </div>

    <button
      @click="refreshStats"
      class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
    >
      Refresh Stats
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const stats = ref({
  uptime: 0,
  connectedClients: 0,
  currentRound: 1,
  creatureCount: 0
});

const refreshStats = async () => {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    stats.value = data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

onMounted(() => {
  refreshStats();
  setInterval(refreshStats, 10000); // Refresh every 10s
});
</script>
```

**Testing Checklist:**
- [ ] Stats endpoint returns data
- [ ] Dashboard displays correctly
- [ ] Auto-refresh works
- [ ] Client count accurate

---

## **TASK 10: Advanced Timer Features** (~4 hours)

**Priority:** Low
**Dependencies:** Existing timer system

### **10.1 Timer Pause/Resume**
**File:** `server/src/timer/TimerManager.ts`

```typescript
export class TimerManager extends EventEmitter {
  private isPaused: boolean = false;
  private pausedAt: number = 0;

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.pausedAt = this.remainingSeconds;
    this.stop();
    this.emit('paused', this.pausedAt);
  }

  public resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.start(this.pausedAt);
    this.emit('resumed');
  }
}
```

### **10.2 Add Pause/Resume UI**
**File:** `web/dm-console/src/components/ControlPanel.vue`

```vue
<!-- Update timer controls -->
<div v-if="timer && timer.isActive" class="timer-display">
  <div class="text-3xl font-bold text-center">{{ formatTime(timer.remainingSeconds) }}</div>
  <div class="flex gap-2 mt-2">
    <button
      @click="$emit('pauseTimer')"
      class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
    >
      ⏸ Pause
    </button>
    <button
      @click="$emit('stopTimer')"
      class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      ⏹ Stop
    </button>
  </div>
</div>
```

**Testing Checklist:**
- [ ] Pause timer mid-countdown
- [ ] Resume timer from paused state
- [ ] Paused time displayed correctly
- [ ] Stop timer from paused state

---

## **TESTING & VALIDATION**

### **Integration Testing**
Create comprehensive test suite in `tests/phase2-integration.test.ts`:
- Session save/restore workflow
- Drag-and-drop reordering
- Creature editing with initiative changes
- Image upload and display
- Condition tracking and duration
- Undo functionality
- Keyboard shortcuts

### **Manual Testing Checklist**
Create `tests/phase2-manual-test-plan.md` covering all new features.

### **Performance Testing**
- Image loading performance
- Large initiative lists (20+ creatures)
- Multiple conditions per creature
- History with 100+ actions

---

## **DEPLOYMENT & DOCUMENTATION**

### **11.1 Update README**
Document all new Phase 2 features with screenshots.

### **11.2 Create User Guide**
Document:
- How to save/load sessions
- How to drag-and-drop reorder
- How to edit creatures
- How to add images
- How to track conditions
- Keyboard shortcuts

### **11.3 Update API Documentation**
Document new WebSocket events:
- `session:list`
- `session:delete`
- `creature:update`
- `state:undo`
- `state:history`

---

## **SUCCESS CRITERIA**

Phase 2 is complete when:
- [ ] All 10 tasks implemented and tested
- [ ] Manual test plan passes 100%
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Performance acceptable (<100ms UI updates)
- [ ] No regressions in Phase 1 features
- [ ] Production deployment successful

---

## **TIMELINE ESTIMATE**

| Task | Hours | Priority |
|------|-------|----------|
| 1. Session Save/Restore UI | 3 | High |
| 2. Drag-and-Drop Reordering | 4 | High |
| 3. Creature Editing UI | 6 | High |
| 4. Creature Avatar Images | 4 | Medium |
| 5. Condition/Effect Tracking | 8 | High |
| 6. Turn History & Undo | 6 | Medium |
| 7. Enhanced Pi Display Typography | 2 | Medium |
| 8. UI/UX Improvements | 8 | Medium |
| 9. System Monitoring Dashboard | 6 | Low |
| 10. Advanced Timer Features | 4 | Low |
| Testing & QA | 8 | High |
| Documentation | 4 | High |
| **TOTAL** | **63 hours** | **(~2-3 weeks)** |

---

## **RISK MITIGATION**

1. **Image Storage**: Data URIs may cause large state sizes
   - *Solution*: Implement image size limits, compress to JPEG

2. **Drag-and-Drop Touch Support**: May not work well on all devices
   - *Solution*: Provide alternative up/down arrow buttons

3. **Condition Duration Complexity**: Edge cases with multiple conditions
   - *Solution*: Comprehensive testing, clear documentation

4. **Performance with Large Lists**: 50+ creatures may slow UI
   - *Solution*: Virtual scrolling, pagination

---

## **FUTURE ENHANCEMENTS (v2.0)**

Deferred to version 2.0:
- ESP32 Player Devices
- Mobile native apps
- VTT integration (Foundry, Roll20)
- Remote play support
- Voice commands
- Advanced analytics
- Multi-user permissions
- Campaign management

---

**END OF PHASE 2 PLAN**
