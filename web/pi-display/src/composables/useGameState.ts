import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { GameState } from '../types';

export function useGameState() {
  const socket = ref<Socket | null>(null);
  const gameState = ref<GameState>({
    creatures: [],
    currentTurnIndex: 0,
    currentRound: 1,
    timer: null
  });
  const connected = ref(false);
  const connectionError = ref<string | null>(null);

  const connect = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

    socket.value = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    socket.value.on('connect', () => {
      connected.value = true;
      connectionError.value = null;
      console.log('Connected to server');

      // Identify as a display client
      socket.value?.emit('identify', { type: 'display', name: 'Pi Display' });

      // Request current state
      socket.value?.emit('state:request');
    });

    socket.value.on('state:update', (state: GameState) => {
      console.log('State update received:', state);
      gameState.value = state;
    });

    socket.value.on('error', (err: any) => {
      console.error('Socket error:', err);
      connectionError.value = err.message || 'Unknown error';
      // Clear error after 5 seconds
      setTimeout(() => {
        connectionError.value = null;
      }, 5000);
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('Disconnected from server');
    });

    socket.value.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      connectionError.value = 'Unable to connect to server';
    });

    socket.value.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      connected.value = true;
      connectionError.value = null;
      // Request state again after reconnection
      socket.value?.emit('state:request');
    });

    socket.value.on('reconnect_error', (err) => {
      console.error('Reconnection error:', err.message);
    });

    socket.value.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      connectionError.value = 'Failed to reconnect to server';
    });
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  });

  return {
    gameState,
    connected,
    connectionError
  };
}