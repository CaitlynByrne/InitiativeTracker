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
          
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
