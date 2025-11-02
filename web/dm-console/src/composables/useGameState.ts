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
  const savedSessions = ref<any[]>([]);

  const connect = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socket.value = io(apiUrl);

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
    socket.value?.emit('creature:add', creature);
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

  const saveSession = (name: string) => {
    socket.value?.emit('session:save', { name }, (response: any) => {
      if (response.success) {
        console.log('Session saved:', name);
      } else {
        error.value = response.error || 'Failed to save session';
        setTimeout(() => error.value = null, 5000);
      }
    });
  };

  const restoreSession = (name: string) => {
    socket.value?.emit('session:restore', { name }, (response: any) => {
      if (response.success) {
        console.log('Session restored:', name);
      } else {
        error.value = response.error || 'Failed to restore session';
        setTimeout(() => error.value = null, 5000);
      }
    });
  };

  const listSessions = () => {
    socket.value?.emit('session:list', (response: any) => {
      if (response.success) {
        savedSessions.value = response.sessions;
      }
    });
  };

  const deleteSession = (name: string) => {
    socket.value?.emit('session:delete', { name }, (response: any) => {
      if (response.success) {
        listSessions(); // Refresh list
      }
    });
  };

  const updateCreature = (id: string, updates: Partial<Creature>) => {
    socket.value?.emit('creature:update', { id, updates }, (response: any) => {
      if (!response.success) {
        error.value = response.error || 'Failed to update creature';
        setTimeout(() => error.value = null, 5000);
      }
    });
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
    reorderInitiative,
    saveSession,
    restoreSession,
    listSessions,
    deleteSession,
    savedSessions,
    updateCreature
  };
}