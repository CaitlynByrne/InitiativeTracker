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
          currentRound > 0 && index === currentTurnIndex
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
                <span v-if="currentRound > 0 && index === currentTurnIndex" class="ml-2 text-green-400">
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
  currentRound: number;
}>();

defineEmits<{
  (e: 'remove', id: string): void;
}>();
</script>