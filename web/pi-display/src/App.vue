<template>
  <div class="pi-display min-h-screen bg-black text-white flex flex-col">
    <!-- Connection Status (subtle) -->
    <div
      v-if="!connected"
      class="connection-lost bg-red-900 text-center py-2 text-xl animate-pulse"
    >
      ⚠️ Disconnected from server...
    </div>

    <!-- Error Display -->
    <div
      v-if="connectionError"
      class="error-banner bg-orange-900 text-center py-2 text-xl"
    >
      {{ connectionError }}
    </div>

    <!-- Main Initiative Display -->
    <div class="flex-1 flex flex-col justify-center p-8">
      <!-- No Creatures Message -->
      <div
        v-if="gameState.creatures.length === 0"
        class="text-center"
      >
        <div class="text-6xl text-gray-600 mb-4">No Active Session</div>
        <div class="text-3xl text-gray-500">Waiting for DM to start initiative...</div>
      </div>

      <!-- Active Session Display -->
      <div v-else>
        <!-- Round Counter -->
        <div class="round-display text-center mb-8">
          <div class="text-4xl text-gray-400">Round</div>
          <div class="text-8xl font-bold text-blue-400">{{ gameState.currentRound }}</div>
        </div>

        <!-- Current Turn (Large) -->
        <div v-if="currentCreature" class="current-turn bg-green-900/30 border-4 border-green-500 rounded-2xl p-12 mb-8">
          <div class="text-5xl text-gray-400 mb-4">CURRENT TURN</div>
          <div class="text-8xl lg:text-10xl font-bold text-green-400 mb-4">
            {{ currentCreature.name }}
          </div>
          <div class="text-6xl text-gray-300">
            Initiative: {{ currentCreature.initiative }}
          </div>
          <div v-if="currentCreature.hp !== undefined" class="text-5xl text-gray-400 mt-4">
            HP: {{ currentCreature.hp }}/{{ currentCreature.maxHp || '?' }}
          </div>
          <div v-if="currentCreature.conditions && currentCreature.conditions.length > 0" class="mt-4 flex gap-3 justify-center flex-wrap">
            <span
              v-for="condition in currentCreature.conditions"
              :key="condition"
              class="condition-tag text-3xl bg-yellow-800 text-yellow-200 px-4 py-2 rounded-lg"
            >
              {{ condition }}
            </span>
          </div>
        </div>

        <!-- Timer Display (if active) -->
        <div
          v-if="gameState.timer && gameState.timer.isActive"
          :class="[
            'timer-display text-center p-8 rounded-xl mb-8',
            gameState.timer.remainingSeconds <= 10
              ? 'bg-red-900/50 border-4 border-red-500'
              : 'bg-yellow-900/30 border-4 border-yellow-500'
          ]"
        >
          <div class="text-5xl text-gray-300 mb-4">Time Remaining</div>
          <div
            :class="[
              'text-10xl lg:text-11xl font-bold leading-none',
              gameState.timer.remainingSeconds <= 10
                ? 'text-red-400 animate-pulse-fast'
                : 'text-yellow-300'
            ]"
          >
            {{ formatTime(gameState.timer.remainingSeconds) }}
          </div>
        </div>

        <!-- Next Up Preview -->
        <div v-if="nextCreature" class="next-up bg-gray-800/50 rounded-xl p-6 text-center">
          <div class="text-3xl text-gray-400 mb-2">Next Up</div>
          <div class="text-5xl font-bold text-blue-300">
            {{ nextCreature.name }}
            <span class="text-4xl text-gray-400 ml-4">(Initiative: {{ nextCreature.initiative }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Initiative Order List (Bottom) -->
    <div v-if="gameState.creatures.length > 0" class="initiative-scroll bg-gray-900/80 p-6">
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div
          v-for="(creature, index) in gameState.creatures"
          :key="creature.id"
          :class="[
            'creature-card flex-shrink-0 min-w-[200px] p-4 rounded-lg border-2 transition-all',
            index === gameState.currentTurnIndex
              ? 'bg-green-900/30 border-green-500 scale-110'
              : index === nextIndex
              ? 'bg-blue-900/30 border-blue-500'
              : 'bg-gray-800 border-gray-600'
          ]"
        >
          <div class="text-2xl font-bold mb-1">
            {{ creature.name }}
            <span v-if="index === gameState.currentTurnIndex" class="text-green-400 ml-2">●</span>
          </div>
          <div class="text-xl text-gray-400">Init: {{ creature.initiative }}</div>
          <div v-if="creature.hp !== undefined" class="text-lg text-gray-500">
            HP: {{ creature.hp }}/{{ creature.maxHp || '?' }}
          </div>
          <div class="text-lg capitalize" :class="getTypeColor(creature.type)">
            {{ creature.type }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameState } from './composables/useGameState';

const { gameState, connected, connectionError } = useGameState();

const currentCreature = computed(() => {
  return gameState.value.creatures[gameState.value.currentTurnIndex];
});

const nextIndex = computed(() => {
  if (gameState.value.creatures.length === 0) return -1;
  return (gameState.value.currentTurnIndex + 1) % gameState.value.creatures.length;
});

const nextCreature = computed(() => {
  return gameState.value.creatures[nextIndex.value];
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'player':
      return 'text-blue-400';
    case 'npc':
      return 'text-green-400';
    case 'monster':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};
</script>

<style scoped>
/* Ensure smooth scrolling for the initiative list */
.initiative-scroll {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
}

.initiative-scroll::-webkit-scrollbar {
  height: 8px;
}

.initiative-scroll::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 4px;
}

.initiative-scroll::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

.initiative-scroll::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Optimize for TV displays */
@media (min-width: 1920px) {
  .pi-display {
    font-size: 1.2rem;
  }
}
</style>