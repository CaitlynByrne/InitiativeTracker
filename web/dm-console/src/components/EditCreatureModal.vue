<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleCancel"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-2xl font-bold mb-4 text-white">Edit Creature</h2>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <!-- Initiative -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Initiative</label>
            <input
              v-model.number="form.initiative"
              type="number"
              required
              min="1"
              max="30"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <p class="text-xs text-gray-400 mt-1">Changing initiative will re-sort the list</p>
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Type</label>
            <select
              v-model="form.type"
              class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="player">Player</option>
              <option value="npc">NPC</option>
              <option value="monster">Monster</option>
            </select>
          </div>

          <!-- HP & Max HP -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Current HP</label>
              <input
                v-model.number="form.hp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Max HP</label>
              <input
                v-model.number="form.maxHp"
                type="number"
                min="0"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Image URL -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Avatar Image
              <span class="text-xs text-gray-400">(URL or upload)</span>
            </label>
            <div class="space-y-2">
              <input
                v-model="form.imageUrl"
                type="text"
                placeholder="https://example.com/image.jpg"
                class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <img
                v-if="form.imageUrl"
                :src="form.imageUrl"
                alt="Preview"
                class="w-16 h-16 rounded object-cover"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="handleCancel"
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Creature } from '../types';
import { resizeImage } from '../utils/imageResize';

const props = defineProps<{
  isOpen: boolean;
  creature: Creature | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', id: string, updates: Partial<Creature>): void;
}>();

const form = reactive({
  name: '',
  initiative: 10,
  type: 'monster' as 'player' | 'npc' | 'monster',
  hp: undefined as number | undefined,
  maxHp: undefined as number | undefined,
  imageUrl: ''
});

watch(() => props.creature, (newCreature) => {
  if (newCreature) {
    form.name = newCreature.name;
    form.initiative = newCreature.initiative;
    form.type = newCreature.type;
    form.hp = newCreature.hp;
    form.maxHp = newCreature.maxHp;
    form.imageUrl = newCreature.imageUrl || '';
  }
}, { immediate: true });

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    // Resize and convert to data URI
    const resizedDataUri = await resizeImage(file, 200, 200);
    form.imageUrl = resizedDataUri;
  } catch (error) {
    console.error('Failed to resize image:', error);
    // Fallback to original file
    const reader = new FileReader();
    reader.onload = (e) => {
      form.imageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handleSubmit = () => {
  if (!props.creature) return;

  const updates: Partial<Creature> = {
    name: form.name,
    initiative: form.initiative,
    type: form.type,
    hp: form.hp,
    maxHp: form.maxHp,
    imageUrl: form.imageUrl || undefined
  };

  emit('save', props.creature.id, updates);
  emit('close');
};

const handleCancel = () => {
  emit('close');
};
</script>
