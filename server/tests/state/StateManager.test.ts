import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StateManager } from '../../src/state/StateManager';
import { GameState, Creature } from '../../src/types';

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockRedisClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      isReady: true
    };

    // Initialize StateManager with mock client
    stateManager = new StateManager(mockRedisClient);
  });

  describe('getState', () => {
    it('should return the initial state when no session exists', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const state = await stateManager.getState('session-123');

      expect(state).toEqual({
        sessionId: 'session-123',
        creatures: [],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      });
    });

    it('should return the stored state when session exists', async () => {
      const storedState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 2,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedState));

      const state = await stateManager.getState('session-123');

      expect(state).toEqual(storedState);
      expect(mockRedisClient.get).toHaveBeenCalledWith('session:session-123');
    });
  });

  describe('saveState', () => {
    it('should save the state to Redis', async () => {
      const state: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.set.mockResolvedValue('OK');

      await stateManager.saveState(state);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'session:session-123',
        JSON.stringify(state),
        { EX: 86400 } // 24 hours TTL
      );
    });
  });

  describe('addCreature', () => {
    it('should add a new creature to the state', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const newCreature: Creature = {
        id: '1',
        name: 'Goblin',
        initiative: 15,
        hp: 10,
        maxHp: 10,
        isNPC: true
      };

      const updatedState = await stateManager.addCreature('session-123', newCreature);

      expect(updatedState.creatures).toHaveLength(1);
      expect(updatedState.creatures[0]).toEqual(newCreature);
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should sort creatures by initiative after adding', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 10, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const newCreature: Creature = {
        id: '2',
        name: 'Player 2',
        initiative: 20,
        hp: 100,
        maxHp: 100,
        isNPC: false
      };

      const updatedState = await stateManager.addCreature('session-123', newCreature);

      expect(updatedState.creatures).toHaveLength(2);
      expect(updatedState.creatures[0].initiative).toBe(20); // Higher initiative first
      expect(updatedState.creatures[1].initiative).toBe(10);
    });
  });

  describe('removeCreature', () => {
    it('should remove a creature from the state', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false },
          { id: '2', name: 'Player 2', initiative: 15, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const updatedState = await stateManager.removeCreature('session-123', '1');

      expect(updatedState.creatures).toHaveLength(1);
      expect(updatedState.creatures[0].id).toBe('2');
    });

    it('should adjust current turn when removing the current creature', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false },
          { id: '2', name: 'Player 2', initiative: 15, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 1,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const updatedState = await stateManager.removeCreature('session-123', '2');

      expect(updatedState.creatures).toHaveLength(1);
      expect(updatedState.currentTurn).toBe(0); // Should reset to 0
    });
  });

  describe('nextTurn', () => {
    it('should advance to the next creature', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false },
          { id: '2', name: 'Player 2', initiative: 15, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 0,
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const updatedState = await stateManager.nextTurn('session-123');

      expect(updatedState.currentTurn).toBe(1);
      expect(updatedState.round).toBe(1); // Round should not change
    });

    it('should increment round when wrapping around', async () => {
      const initialState: GameState = {
        sessionId: 'session-123',
        creatures: [
          { id: '1', name: 'Player 1', initiative: 20, hp: 100, maxHp: 100, isNPC: false },
          { id: '2', name: 'Player 2', initiative: 15, hp: 100, maxHp: 100, isNPC: false }
        ],
        currentTurn: 1, // Last creature
        round: 1,
        isPaused: false,
        turnTimer: null
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(initialState));
      mockRedisClient.set.mockResolvedValue('OK');

      const updatedState = await stateManager.nextTurn('session-123');

      expect(updatedState.currentTurn).toBe(0); // Wrap to first creature
      expect(updatedState.round).toBe(2); // Round incremented
    });
  });

  describe('clearSession', () => {
    it('should delete the session from Redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await stateManager.clearSession('session-123');

      expect(mockRedisClient.del).toHaveBeenCalledWith('session:session-123');
    });
  });
});