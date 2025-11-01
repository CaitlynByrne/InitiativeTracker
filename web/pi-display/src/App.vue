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

    <!-- No Creatures Message -->
    <div
      v-if="gameState.creatures.length === 0"
      class="flex-1 flex flex-col justify-center items-center p-8"
    >
      <div class="text-6xl text-gray-600 mb-4">No Active Session</div>
      <div class="text-3xl text-gray-500">Waiting for DM to start initiative...</div>
    </div>

    <!-- Active Session Display -->
    <div v-else class="flex-1 overflow-hidden">
      <!-- LANDSCAPE LAYOUT -->
      <div v-if="isLandscape" class="h-full flex">
        <!-- Left Side: Rolodex Turn Order -->
        <div class="rolodex-container w-1/2 h-full bg-gray-950 border-r-4 border-gray-800 overflow-hidden relative">
          <div class="absolute inset-0 flex flex-col justify-center items-center p-4">
            <!-- Rolodex Cards -->
            <div class="rolodex-viewport relative w-full" style="height: 90%;">
              <transition-group name="rolodex" tag="div" class="relative h-full">
                <div
                  v-for="(creature, displayIndex) in rolodexCreatures"
                  :key="`${creature.id}-${displayIndex}`"
                  :class="[
                    'rolodex-card absolute w-full px-6 py-4 rounded-2xl border-4 transition-all duration-500',
                    getCreatureCardClass(creature.type, displayIndex)
                  ]"
                  :style="getRolodexCardStyle(displayIndex)"
                >
                  <!-- Current Turn Indicator -->
                  <div v-if="displayIndex === 0" class="absolute top-2 right-4 text-3xl animate-pulse">
                    ▶ NOW
                  </div>
                  <div v-if="displayIndex === 1" class="absolute top-2 right-4 text-2xl text-gray-400">
                    NEXT
                  </div>

                  <div class="flex items-center gap-4">
                    <!-- Initiative Badge -->
                    <div class="text-5xl font-bold bg-black/30 px-4 py-2 rounded-xl">
                      {{ creature.initiative }}
                    </div>

                    <!-- Creature Info -->
                    <div class="flex-1">
                      <div class="text-4xl font-bold mb-1">{{ creature.name }}</div>
                      <div class="text-2xl opacity-80 capitalize">{{ creature.type }}</div>
                      <div v-if="creature.hp !== undefined" class="text-2xl mt-1 opacity-70">
                        HP: {{ creature.hp }}/{{ creature.maxHp || '?' }}
                      </div>
                    </div>
                  </div>

                  <!-- Conditions -->
                  <div v-if="creature.conditions && creature.conditions.length > 0" class="mt-3 flex gap-2 flex-wrap">
                    <span
                      v-for="condition in creature.conditions"
                      :key="condition"
                      class="text-xl bg-yellow-800 text-yellow-200 px-3 py-1 rounded-lg"
                    >
                      {{ condition }}
                    </span>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </div>

        <!-- Right Side: Round Counter & Timers -->
        <div class="w-1/2 h-full bg-gray-900 flex flex-col justify-center items-center p-8">
          <!-- Round Counter -->
          <div class="text-center mb-12">
            <div class="text-5xl text-gray-400 mb-4">Round</div>
            <div class="text-9xl font-bold text-blue-400">{{ gameState.currentRound }}</div>
          </div>

          <!-- Timer Display -->
          <div
            v-if="gameState.timer && gameState.timer.isActive"
            :class="[
              'timer-display text-center p-8 rounded-2xl w-full max-w-lg',
              gameState.timer.remainingSeconds <= 10
                ? 'bg-red-900/50 border-4 border-red-500'
                : 'bg-yellow-900/30 border-4 border-yellow-500'
            ]"
          >
            <div class="text-4xl text-gray-300 mb-4">Time Remaining</div>
            <div
              :class="[
                'text-8xl font-bold',
                gameState.timer.remainingSeconds <= 10
                  ? 'text-red-400 animate-pulse'
                  : 'text-yellow-300'
              ]"
            >
              {{ formatTime(gameState.timer.remainingSeconds) }}
            </div>
          </div>

          <!-- Turn Progress Indicator -->
          <div v-if="gameState.creatures.length > 1" class="mt-12 text-center">
            <div class="text-3xl text-gray-500">
              Turn {{ gameState.currentTurnIndex + 1 }} of {{ gameState.creatures.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- PORTRAIT LAYOUT -->
      <div v-else class="h-full flex flex-col overflow-y-auto">
        <!-- Round at Top -->
        <div class="bg-gray-900 border-b-4 border-gray-700 px-6 py-4 text-center">
          <div class="text-3xl text-gray-400 inline mr-4">Round</div>
          <span class="text-5xl font-bold text-blue-400">{{ gameState.currentRound }}</span>
        </div>

        <!-- Current Turn -->
        <div
          v-if="currentCreature"
          :class="[
            'current-turn px-6 py-6 border-b-4',
            getCreatureBackgroundClass(currentCreature.type)
          ]"
        >
          <div class="text-2xl text-gray-300 mb-2">CURRENT TURN</div>
          <div class="text-5xl font-bold mb-2">{{ currentCreature.name }}</div>
          <div class="flex gap-4 text-2xl opacity-80">
            <span>Initiative: {{ currentCreature.initiative }}</span>
            <span v-if="currentCreature.hp !== undefined">
              HP: {{ currentCreature.hp }}/{{ currentCreature.maxHp || '?' }}
            </span>
          </div>
          <div v-if="currentCreature.conditions && currentCreature.conditions.length > 0" class="mt-3 flex gap-2 flex-wrap">
            <span
              v-for="condition in currentCreature.conditions"
              :key="condition"
              class="text-xl bg-yellow-800 text-yellow-200 px-3 py-1 rounded-lg"
            >
              {{ condition }}
            </span>
          </div>
        </div>

        <!-- Timer (if active) -->
        <div
          v-if="gameState.timer && gameState.timer.isActive"
          :class="[
            'timer-display px-6 py-6 text-center border-b-4',
            gameState.timer.remainingSeconds <= 10
              ? 'bg-red-900/50 border-red-700'
              : 'bg-yellow-900/30 border-yellow-700'
          ]"
        >
          <div class="text-2xl text-gray-300 mb-2">Time Remaining</div>
          <div
            :class="[
              'text-6xl font-bold',
              gameState.timer.remainingSeconds <= 10
                ? 'text-red-400 animate-pulse'
                : 'text-yellow-300'
            ]"
          >
            {{ formatTime(gameState.timer.remainingSeconds) }}
          </div>
        </div>

        <!-- Upcoming Turns -->
        <div class="flex-1 bg-gray-950">
          <div class="px-6 py-4 text-2xl text-gray-400 border-b-2 border-gray-800">
            Upcoming Turns
          </div>
          <div class="space-y-0">
            <div
              v-for="(creature, index) in upcomingCreatures"
              :key="creature.id"
              :class="[
                'px-6 py-4 border-b-2 border-gray-800',
                getCreatureBackgroundClass(creature.type, true)
              ]"
            >
              <div class="flex items-center gap-4">
                <div class="text-3xl font-bold bg-black/30 px-3 py-1 rounded-lg">
                  {{ creature.initiative }}
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold">
                    {{ creature.name }}
                    <span v-if="index === 0" class="text-2xl text-gray-400 ml-3">(NEXT)</span>
                  </div>
                  <div class="text-xl opacity-70 capitalize">{{ creature.type }}</div>
                </div>
                <div v-if="creature.hp !== undefined" class="text-xl opacity-60">
                  {{ creature.hp }}/{{ creature.maxHp || '?' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from './composables/useGameState';

const { gameState, connected, connectionError } = useGameState();

// Responsive design detection
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);
const isLandscape = computed(() => windowWidth.value > windowHeight.value);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Current creature
const currentCreature = computed(() => {
  return gameState.value.creatures[gameState.value.currentTurnIndex];
});

// Rolodex creatures for landscape view
const rolodexCreatures = computed(() => {
  const creatures = [...gameState.value.creatures];
  const currentIndex = gameState.value.currentTurnIndex;

  // Reorder array so current is first
  const reordered = [
    ...creatures.slice(currentIndex),
    ...creatures.slice(0, currentIndex)
  ];

  // Return only what we can display (limit to 5 for visual clarity)
  return reordered.slice(0, Math.min(5, reordered.length));
});

// Upcoming creatures for portrait view
const upcomingCreatures = computed(() => {
  const creatures = [...gameState.value.creatures];
  const currentIndex = gameState.value.currentTurnIndex;

  // Get all creatures after current
  const afterCurrent = creatures.slice(currentIndex + 1);
  const beforeCurrent = creatures.slice(0, currentIndex);

  return [...afterCurrent, ...beforeCurrent];
});

// Format timer
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get creature card class based on type
const getCreatureCardClass = (type: string, displayIndex: number): string => {
  const baseClass = displayIndex === 0
    ? 'border-white shadow-2xl z-30 scale-105'
    : displayIndex === 1
    ? 'border-gray-400 shadow-xl z-20'
    : 'border-gray-600 shadow-lg z-10';

  switch (type) {
    case 'player':
      return `${baseClass} bg-blue-800/90 text-blue-100`;
    case 'npc':
      return `${baseClass} bg-green-800/90 text-green-100`;
    case 'monster':
      return `${baseClass} bg-red-800/90 text-red-100`;
    default:
      return `${baseClass} bg-gray-800/90 text-gray-100`;
  }
};

// Get background class for portrait mode
const getCreatureBackgroundClass = (type: string, isUpcoming: boolean = false): string => {
  const opacity = isUpcoming ? '60' : '80';
  const borderOpacity = isUpcoming ? '600' : '500';

  switch (type) {
    case 'player':
      return `bg-blue-900/${opacity} border-blue-${borderOpacity}`;
    case 'npc':
      return `bg-green-900/${opacity} border-green-${borderOpacity}`;
    case 'monster':
      return `bg-red-900/${opacity} border-red-${borderOpacity}`;
    default:
      return `bg-gray-900/${opacity} border-gray-${borderOpacity}`;
  }
};

// Calculate rolodex card positioning
const getRolodexCardStyle = (index: number): string => {
  const baseTop = 25; // Start position percentage
  const spacing = 120; // Pixels between cards
  const rotation = index * 2; // Slight rotation for depth
  const translateY = index * spacing;

  return `
    top: ${baseTop}%;
    transform: translateY(${translateY - 100}px) translateX(-50%) rotateX(${rotation}deg);
    left: 50%;
    opacity: ${index > 3 ? 0.3 : 1};
  `;
};
</script>

<style scoped>
/* Rolodex animation */
.rolodex-enter-active,
.rolodex-leave-active {
  transition: all 0.5s ease;
}

.rolodex-enter-from {
  transform: translateY(100%) translateX(-50%);
  opacity: 0;
}

.rolodex-leave-to {
  transform: translateY(-200%) translateX(-50%);
  opacity: 0;
}

/* Preserve 3D for rolodex effect */
.rolodex-viewport {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.rolodex-card {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Fast pulse for timer warning */
@keyframes pulse-fast {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-fast {
  animation: pulse-fast 0.5s ease-in-out infinite;
}

/* Portrait mode scrollbar */
@media (orientation: portrait) {
  .pi-display {
    max-height: 100vh;
    overflow: hidden;
  }
}

/* Optimize for TV displays */
@media (min-width: 1920px) {
  .pi-display {
    font-size: 1.1rem;
  }
}
</style>