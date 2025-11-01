import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameState } from '@/composables/useGameState';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

describe('useGameState', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock socket
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'test-socket-id'
    };

    // Mock io to return our mock socket
    (io as any).mockReturnValue(mockSocket);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { state, isConnected } = useGameState();

      expect(state.value).toEqual({
        sessionId: '',
        creatures: [],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      });

      expect(isConnected.value).toBe(true);
    });

    it('should connect to the WebSocket server', () => {
      useGameState();

      expect(io).toHaveBeenCalledWith(
        expect.stringContaining('http://'),
        expect.objectContaining({
          transports: ['websocket', 'polling']
        })
      );
    });

    it('should register event listeners', () => {
      useGameState();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('stateUpdate', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('creature management', () => {
    it('should add a creature', () => {
      const { addCreature } = useGameState();

      const newCreature = {
        name: 'Goblin',
        initiative: 15,
        hp: 10,
        maxHp: 10,
        isNPC: true
      };

      addCreature(newCreature);

      expect(mockSocket.emit).toHaveBeenCalledWith('addCreature', newCreature);
    });

    it('should remove a creature', () => {
      const { removeCreature } = useGameState();

      removeCreature('creature-id-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('removeCreature', { creatureId: 'creature-id-123' });
    });

    it('should update a creature', () => {
      const { updateCreature } = useGameState();

      const updates = {
        id: 'creature-id-123',
        hp: 5
      };

      updateCreature('creature-id-123', updates);

      expect(mockSocket.emit).toHaveBeenCalledWith('updateCreature', {
        creatureId: 'creature-id-123',
        updates
      });
    });

    it('should reorder creatures', () => {
      const { reorderCreatures, state } = useGameState();

      // Set up initial state with creatures
      state.value.creatures = [
        { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false },
        { id: '2', name: 'Player 2', initiative: 15, hp: 100, maxHp: 100, isNPC: false },
        { id: '3', name: 'Player 3', initiative: 10, hp: 100, maxHp: 100, isNPC: false }
      ];

      // Reorder: move Player 3 to position 1 (index 0 to 1)
      reorderCreatures(2, 0);

      expect(mockSocket.emit).toHaveBeenCalledWith('reorderCreatures', {
        creatures: expect.arrayContaining([
          expect.objectContaining({ id: '3' }), // Player 3 moved to first
          expect.objectContaining({ id: '1' }), // Player 1 moved to second
          expect.objectContaining({ id: '2' })  // Player 2 stays third
        ])
      });
    });
  });

  describe('turn management', () => {
    it('should advance to next turn', () => {
      const { nextTurn } = useGameState();

      nextTurn();

      expect(mockSocket.emit).toHaveBeenCalledWith('nextTurn');
    });

    it('should go to previous turn', () => {
      const { previousTurn } = useGameState();

      previousTurn();

      expect(mockSocket.emit).toHaveBeenCalledWith('previousTurn');
    });

    it('should set current turn', () => {
      const { setCurrentTurn } = useGameState();

      setCurrentTurn(3);

      expect(mockSocket.emit).toHaveBeenCalledWith('setCurrentTurn', { turn: 3 });
    });
  });

  describe('timer management', () => {
    it('should start turn timer', () => {
      const { startTimer } = useGameState();

      startTimer(60);

      expect(mockSocket.emit).toHaveBeenCalledWith('startTimer', { duration: 60 });
    });

    it('should pause timer', () => {
      const { pauseTimer } = useGameState();

      pauseTimer();

      expect(mockSocket.emit).toHaveBeenCalledWith('pauseTimer');
    });

    it('should resume timer', () => {
      const { resumeTimer } = useGameState();

      resumeTimer();

      expect(mockSocket.emit).toHaveBeenCalledWith('resumeTimer');
    });

    it('should stop timer', () => {
      const { stopTimer } = useGameState();

      stopTimer();

      expect(mockSocket.emit).toHaveBeenCalledWith('stopTimer');
    });
  });

  describe('session management', () => {
    it('should join a session', () => {
      const { joinSession } = useGameState();

      joinSession('session-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('joinSession', { sessionId: 'session-123' });
    });

    it('should leave a session', () => {
      const { leaveSession } = useGameState();

      leaveSession();

      expect(mockSocket.emit).toHaveBeenCalledWith('leaveSession');
    });

    it('should reset the session', () => {
      const { resetSession } = useGameState();

      resetSession();

      expect(mockSocket.emit).toHaveBeenCalledWith('resetSession');
    });
  });

  describe('state updates', () => {
    it('should handle state update from server', () => {
      const { state } = useGameState();

      // Get the stateUpdate handler that was registered
      const stateUpdateHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'stateUpdate'
      )[1];

      const newState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 2,
        isPaused: false,
        turnTimer: null
      };

      // Simulate server sending state update
      stateUpdateHandler(newState);

      expect(state.value).toEqual(newState);
    });

    it('should handle connection status changes', () => {
      const { isConnected } = useGameState();

      // Get the disconnect handler
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )[1];

      // Simulate disconnect
      disconnectHandler();

      expect(isConnected.value).toBe(false);

      // Get the connect handler
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )[1];

      // Simulate reconnect
      connectHandler();

      expect(isConnected.value).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should disconnect and clean up on unmount', () => {
      const { disconnect } = useGameState();

      disconnect();

      expect(mockSocket.off).toHaveBeenCalledWith('connect');
      expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
      expect(mockSocket.off).toHaveBeenCalledWith('stateUpdate');
      expect(mockSocket.off).toHaveBeenCalledWith('error');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});