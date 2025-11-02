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
          :current-round="gameState.currentRound"
          @remove="removeCreature"
          @reorder="reorderInitiative"
          @edit="handleEdit"
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

    <!-- Session Management (Full Width) -->
    <div class="mt-4">
      <SessionManager
        ref="sessionManagerRef"
        @save="saveSession"
        @restore="restoreSession"
        @delete="deleteSession"
        @list="handleSessionList"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameState } from './composables/useGameState';
import InitiativeList from './components/InitiativeList.vue';
import AddCreatureForm from './components/AddCreatureForm.vue';
import ControlPanel from './components/ControlPanel.vue';
import SessionManager from './components/SessionManager.vue';

const {
  gameState,
  connected,
  error,
  addCreature,
  removeCreature,
  nextTurn,
  startTimer,
  stopTimer,
  resetSession,
  reorderInitiative,
  saveSession,
  restoreSession,
  listSessions,
  deleteSession,
  savedSessions
} = useGameState();

const sessionManagerRef = ref<InstanceType<typeof SessionManager> | null>(null);

const handleSessionList = () => {
  listSessions();
  setTimeout(() => {
    sessionManagerRef.value?.updateSessions(savedSessions.value);
  }, 100);
};

const handleEdit = (id: string) => {
  console.log('Edit creature:', id);
  // Will be implemented in Task 3
};
</script>