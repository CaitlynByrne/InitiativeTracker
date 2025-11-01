<template>
  <div class="initiative-list bg-gray-800 rounded-lg p-4">
    <h2 class="text-xl font-bold mb-4 text-white">Initiative Order</h2>

    <div v-if="creatures.length === 0" class="text-gray-400 text-center py-8">
      No creatures in initiative. Add some to get started!
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(creature, displayIndex) in orderedCreatures"
        :key="creature.id"
        :class="[
          'creature-card p-3 rounded border-2 transition-all',
          currentRound > 0 && displayIndex === 0
            ? getActiveCreatureClass(creature.type)
            : getCreatureClass(creature.type)
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Current/Next Indicator -->
            <div v-if="currentRound > 0 && displayIndex === 0" class="text-yellow-400 font-bold animate-pulse">
              ▶
            </div>
            <div v-else-if="currentRound > 0 && displayIndex === 1" class="text-gray-400">
              ⏭
            </div>
            <div v-else class="w-4"></div>

            <!-- Initiative Badge -->
            <div class="initiative-badge bg-gray-800 text-white font-bold px-3 py-1 rounded border border-gray-600">
              {{ creature.initiative }}
            </div>

            <!-- Creature Info -->
            <div>
              <div class="creature-name font-bold text-white">
                {{ creature.name }}
                <span v-if="currentRound > 0 && displayIndex === 0" class="ml-2 text-yellow-400 text-sm">
                  (CURRENT)
                </span>
                <span v-else-if="currentRound > 0 && displayIndex === 1" class="ml-2 text-gray-400 text-sm">
                  (NEXT)
                </span>
              </div>
              <div :class="['creature-type text-sm capitalize', getTypeTextColor(creature.type)]">
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
import { computed } from 'vue';
import type { Creature } from '../types';

const props = defineProps<{
  creatures: Creature[];
  currentTurnIndex: number;
  currentRound: number;
}>();

defineEmits<{
  (e: 'remove', id: string): void;
}>();

// Reorder creatures so current is first (like the Pi display)
const orderedCreatures = computed(() => {
  const creatures = [...props.creatures];
  const currentIndex = props.currentTurnIndex;

  // If combat hasn't started yet, return creatures in their current order
  if (currentIndex < 0 || props.currentRound === 0) {
    return creatures;
  }

  // Reorder array so current is first, followed by upcoming turns
  return [
    ...creatures.slice(currentIndex),
    ...creatures.slice(0, currentIndex)
  ];
});

// Get creature class based on type (inactive state)
const getCreatureClass = (type: string): string => {
  switch (type) {
    case 'player':
      return 'border-blue-600 bg-blue-900/30';
    case 'npc':
      return 'border-green-600 bg-green-900/30';
    case 'monster':
      return 'border-red-600 bg-red-900/30';
    default:
      return 'border-gray-600 bg-gray-700';
  }
};

// Get creature class for active turn
const getActiveCreatureClass = (type: string): string => {
  switch (type) {
    case 'player':
      return 'border-blue-400 bg-blue-800/50 ring-2 ring-blue-400';
    case 'npc':
      return 'border-green-400 bg-green-800/50 ring-2 ring-green-400';
    case 'monster':
      return 'border-red-400 bg-red-800/50 ring-2 ring-red-400';
    default:
      return 'border-green-500 bg-green-900/20';
  }
};

// Get text color for creature type
const getTypeTextColor = (type: string): string => {
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