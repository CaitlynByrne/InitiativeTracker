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
  (e: 'list'): void;
}>();

const sessionName = ref('');
const sessions = ref<SavedSession[]>([]);
const loading = ref(false);
const saving = ref(false);

const loadSessions = () => {
  loading.value = true;
  emit('list');
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
