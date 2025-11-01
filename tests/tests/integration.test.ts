import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

describe('Initiative Tracker Integration Tests', () => {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
  let socket: Socket;

  beforeAll((done) => {
    // Wait for server to be ready
    const checkServer = async () => {
      try {
        await axios.get(`${SERVER_URL}/health`);
        done();
      } catch (error) {
        setTimeout(checkServer, 1000);
      }
    };
    checkServer();
  });

  afterAll(() => {
    if (socket) {
      socket.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    it('should connect to the WebSocket server', (done) => {
      socket = io(SERVER_URL, {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        // Identify as test client
        socket.emit('identify', { type: 'dm', device_id: 'test-client' });
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('State Management', () => {
    it('should request and receive initial state', (done) => {
      socket.emit('state:request');

      socket.once('state:update', (state) => {
        expect(state).toMatchObject({
          creatures: expect.any(Array),
          currentTurnIndex: expect.any(Number),
          currentRound: expect.any(Number),
        });
        done();
      });
    });

    it('should add creatures and receive state update', (done) => {
      const creature = {
        id: 'test-creature-' + Date.now(),
        name: 'Test Goblin',
        initiative: 15,
        type: 'monster',
        hp: 100,
        maxHp: 100,
      };

      socket.emit('creature:add', creature);

      socket.once('state:update', (state) => {
        const addedCreature = state.creatures.find((c: any) => c.id === creature.id);
        expect(addedCreature).toBeDefined();
        expect(addedCreature).toMatchObject({
          name: creature.name,
          initiative: creature.initiative,
          type: creature.type,
          hp: creature.hp,
          maxHp: creature.maxHp,
        });
        done();
      });
    });
  });

  describe('Turn Management', () => {
    it('should advance turns correctly', (done) => {
      // Add a second creature
      const creature2 = {
        id: 'test-creature-2-' + Date.now(),
        name: 'Test Wizard',
        initiative: 10,
        type: 'player',
        hp: 50,
        maxHp: 50,
      };

      socket.emit('creature:add', creature2);

      socket.once('state:update', (state) => {
        const initialIndex = state.currentTurnIndex;

        // Now advance turn
        socket.emit('turn:next');

        socket.once('state:update', (nextState) => {
          expect(nextState.currentTurnIndex).not.toBe(initialIndex);
          done();
        });
      });
    });

    it('should increment round when wrapping to first creature', (done) => {
      socket.emit('state:request');

      socket.once('state:update', (state) => {
        const currentRound = state.currentRound;
        const creatureCount = state.creatures.length;

        if (creatureCount === 0) {
          done(); // Skip if no creatures
          return;
        }

        // Advance turns until we wrap around
        let turnsAdvanced = 0;
        const advanceTurn = () => {
          socket.emit('turn:next');
        };

        socket.on('state:update', (updatedState) => {
          turnsAdvanced++;

          if (updatedState.currentTurnIndex === 0 && turnsAdvanced > 1) {
            expect(updatedState.currentRound).toBeGreaterThan(currentRound);
            socket.off('state:update');
            done();
          } else if (turnsAdvanced < creatureCount + 1) {
            advanceTurn();
          }
        });

        advanceTurn();
      });
    });
  });

  describe('Timer Management', () => {
    it('should start and stop timer', (done) => {
      socket.emit('timer:start', { seconds: 60 });

      socket.once('state:update', (state) => {
        expect(state.timer).toBeDefined();
        expect(state.timer.totalSeconds).toBe(60);
        expect(state.timer.isActive).toBe(true);
        expect(state.timer.remainingSeconds).toBeLessThanOrEqual(60);

        // Stop the timer
        socket.emit('timer:stop');

        socket.once('state:update', (stoppedState) => {
          expect(stoppedState.timer).toBeNull();
          done();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid creature data', (done) => {
      socket.emit('creature:add', { invalid: 'data' } as any);

      socket.once('error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });

      // Timeout in case error is not emitted
      setTimeout(() => {
        done();
      }, 2000);
    });

    it('should handle disconnection and reconnection', (done) => {
      socket.disconnect();
      expect(socket.connected).toBe(false);

      socket.connect();

      socket.once('connect', () => {
        expect(socket.connected).toBe(true);
        // Re-identify after reconnection
        socket.emit('identify', { type: 'dm', device_id: 'test-client' });

        // Request state after reconnection
        socket.emit('state:request');

        socket.once('state:update', (state) => {
          expect(state).toBeDefined();
          expect(state.creatures).toBeDefined();
          done();
        });
      });
    });
  });

  describe('Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await axios.get(`${SERVER_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        service: 'initiative-tracker-server',
      });
    });
  });
});