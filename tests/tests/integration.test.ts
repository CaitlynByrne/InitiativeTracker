import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

describe('Initiative Tracker Integration Tests', () => {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
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
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Session Management', () => {
    it('should join a session and receive initial state', (done) => {
      const sessionId = 'test-session-' + Date.now();

      socket.emit('joinSession', { sessionId });

      socket.once('stateUpdate', (state) => {
        expect(state).toMatchObject({
          sessionId,
          creatures: [],
          currentTurn: 0,
          round: 1,
          isPaused: false,
        });
        done();
      });
    });

    it('should create and update creatures in session', (done) => {
      const creature = {
        name: 'Test Creature',
        initiative: 15,
        hp: 100,
        maxHp: 100,
        isNPC: false,
      };

      socket.emit('addCreature', creature);

      socket.once('stateUpdate', (state) => {
        expect(state.creatures).toHaveLength(1);
        expect(state.creatures[0]).toMatchObject({
          name: creature.name,
          initiative: creature.initiative,
          hp: creature.hp,
          maxHp: creature.maxHp,
          isNPC: creature.isNPC,
        });
        expect(state.creatures[0].id).toBeDefined();
        done();
      });
    });
  });

  describe('Turn Management', () => {
    it('should advance turns correctly', (done) => {
      // Add a second creature
      socket.emit('addCreature', {
        name: 'Second Creature',
        initiative: 10,
        hp: 50,
        maxHp: 50,
        isNPC: true,
      });

      socket.once('stateUpdate', () => {
        // Now advance turn
        socket.emit('nextTurn');

        socket.once('stateUpdate', (state) => {
          expect(state.currentTurn).toBe(1);
          expect(state.round).toBe(1); // Still first round
          done();
        });
      });
    });

    it('should increment round when wrapping', (done) => {
      // Advance turn again (should wrap to 0 and increment round)
      socket.emit('nextTurn');

      socket.once('stateUpdate', (state) => {
        expect(state.currentTurn).toBe(0);
        expect(state.round).toBe(2); // Round incremented
        done();
      });
    });
  });

  describe('Timer Management', () => {
    it('should start and stop timer', (done) => {
      socket.emit('startTimer', { duration: 60 });

      socket.once('timerUpdate', (timer) => {
        expect(timer).toMatchObject({
          duration: 60,
          isPaused: false,
        });
        expect(timer.startTime).toBeDefined();

        // Stop the timer
        socket.emit('stopTimer');

        socket.once('timerUpdate', (stoppedTimer) => {
          expect(stoppedTimer).toBeNull();
          done();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid creature data', (done) => {
      socket.emit('addCreature', { invalid: 'data' });

      socket.once('error', (error) => {
        expect(error.message).toContain('Invalid creature data');
        done();
      });
    });

    it('should handle disconnection and reconnection', (done) => {
      const sessionId = socket.id;

      socket.disconnect();
      expect(socket.connected).toBe(false);

      socket.connect();

      socket.once('connect', () => {
        expect(socket.connected).toBe(true);
        // Session should be maintained
        socket.once('stateUpdate', (state) => {
          expect(state.creatures.length).toBeGreaterThan(0);
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