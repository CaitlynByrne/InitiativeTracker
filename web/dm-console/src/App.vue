<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { io, Socket } from 'socket.io-client';

const socket = ref<Socket | null>(null);
const connected = ref(false);
const socketId = ref<string>('');

onMounted(() => {
  // Connect to WebSocket server
  socket.value = io('http://localhost:3000');

  socket.value.on('connect', () => {
    connected.value = true;
    console.log('Connected to server');

    // Identify as DM console
    socket.value?.emit('identify', { type: 'dm' });
  });

  socket.value.on('disconnect', () => {
    connected.value = false;
    console.log('Disconnected from server');
  });

  socket.value.on('identified', (data: { status: string; socket_id: string }) => {
    socketId.value = data.socket_id;
    console.log('Identified:', data);
  });
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <div class="container mx-auto p-6">
      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center justify-between">
          <h1 class="text-4xl font-bold text-blue-400">Initiative Tracker</h1>
          <div class="flex items-center gap-2">
            <span
              :class="[
                'inline-block w-3 h-3 rounded-full',
                connected ? 'bg-green-500' : 'bg-red-500',
              ]"
            ></span>
            <span class="text-sm">
              {{ connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
        <p class="text-slate-400 mt-2">DM Console</p>
      </header>

      <!-- Main Content -->
      <main>
        <div class="bg-slate-800 rounded-lg p-6 shadow-lg">
          <h2 class="text-2xl font-semibold mb-4">Welcome to Initiative Tracker</h2>
          <p class="text-slate-300">
            Server connection status: <span class="font-bold">{{ connected ? '✓ Connected' : '✗ Disconnected' }}</span>
          </p>
          <p v-if="socketId" class="text-slate-400 text-sm mt-2">
            Socket ID: {{ socketId }}
          </p>
          <div class="mt-6">
            <p class="text-slate-300">
              The server is running and ready. Next steps will add initiative tracking functionality.
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
