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
            'creature-card p-3 rounded border-2 transition-all',
            index === currentTurnIndex
              ? getActiveCreatureClass(creature.type)
              : getCreatureClass(creature.type)
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
              <!-- Current/Next Indicator -->
              <div v-if="currentRound > 0 && index === currentTurnIndex" class="text-yellow-400 font-bold animate-pulse">
                ▶
              </div>
              <div v-else class="w-4"></div>

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
                <div :class="['creature-type text-sm capitalize', getTypeTextColor(creature.type)]">
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
  currentRound: number;
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
