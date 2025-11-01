<template>
  <div class="control-panel bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Combat Controls</h2>

    <!-- Turn Info -->
    <div class="turn-info bg-gray-700 p-3 rounded mb-4">
      <div v-if="currentRound === 0" class="text-lg font-bold text-white">
        Combat Not Started
      </div>
      <div v-else class="text-lg font-bold text-white">
        Round {{ currentRound }}
      </div>
      <div v-if="currentRound > 0 && currentCreature" class="text-sm text-gray-300">
        Current Turn: {{ currentCreature.name }}
      </div>
    </div>

    <!-- Next Turn Button / Start Combat Button -->
    <button
      @click="$emit('nextTurn')"
      :disabled="creatures.length === 0"
      class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded mb-4 transition-colors"
    >
      {{ currentRound === 0 ? 'Start Combat →' : 'Next Turn →' }}
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
  if (props.currentTurnIndex < 0 || props.currentTurnIndex >= props.creatures.length) {
    return undefined;
  }
  return props.creatures[props.currentTurnIndex];
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>