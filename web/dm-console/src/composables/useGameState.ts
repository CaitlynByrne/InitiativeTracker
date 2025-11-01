import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { GameState, Creature } from '../types';

export function useGameState() {
  const socket = ref<Socket | null>(null);
  const gameState = ref<GameState>({
    creatures: [],
    currentTurnIndex: 0,
    currentRound: 1,
    timer: null
  });
  const connected = ref(false);
  const error = ref<string | null>(null);

  const connect = () => {
    socket.value = io('http://localhost:3001');

    socket.value.on('connect', () => {
      connected.value = true;
      socket.value?.emit('identify', { type: 'dm', name: 'DM Console' });
      socket.value?.emit('state:request');
    });

    socket.value.on('state:update', (state: GameState) => {
      gameState.value = state;
    });

    socket.value.on('error', (err: any) => {
      error.value = err.message || 'Unknown error';
      setTimeout(() => error.value = null, 5000);
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });
  };

  const addCreature = (creature: Omit<Creature, 'id'>) => {
    socket.value?.emit('creature:add', {
      ...creature,
      id: `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  };

  const removeCreature = (id: string) => {
    socket.value?.emit('creature:remove', { id });
  };

  const nextTurn = () => {
    socket.value?.emit('turn:next');
  };

  const startTimer = (seconds: number) => {
    socket.value?.emit('timer:start', { duration: seconds });
  };

  const stopTimer = () => {
    socket.value?.emit('timer:stop');
  };

  const resetSession = () => {
    if (confirm('Reset entire session? This cannot be undone.')) {
      socket.value?.emit('session:reset');
    }
  };

  const reorderInitiative = (fromIndex: number, toIndex: number) => {
    socket.value?.emit('initiative:reorder', { fromIndex, toIndex });
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  return {
    gameState,
    connected,
    error,
    addCreature,
    removeCreature,
    nextTurn,
    startTimer,
    stopTimer,
    resetSession,
    reorderInitiative
  };
}