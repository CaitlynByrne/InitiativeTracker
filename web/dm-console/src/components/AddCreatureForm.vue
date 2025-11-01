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