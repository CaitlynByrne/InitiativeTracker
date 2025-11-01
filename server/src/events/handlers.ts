/**
 * WebSocket event handlers
 */

import { Socket, Server } from 'socket.io';
import { StateManager } from '../state/StateManager';
import { Creature } from '../types';
import { logger } from '../utils/logger';

export class EventHandlers {
  private stateManager: StateManager;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.stateManager = StateManager.getInstance();

    // Listen to state changes and broadcast
    this.stateManager.on('stateChanged', (state) => {
      this.io.emit('state:update', state);
    });

    // Listen to timer expiration
    this.stateManager.on('timerExpired', () => {
      this.io.emit('timer:expired');
    });
  }

  /**
   * Register all event handlers for a socket
   */
  registerHandlers(socket: Socket): void {
    // Client identification
    socket.on('identify', (data: { type: string; device_id?: string }) =>
      this.handleIdentify(socket, data)
    );

    // State requests
    socket.on('state:request', () => this.handleStateRequest(socket));

    // Creature management
    socket.on('creature:add', (data: Omit<Creature, 'id'>, callback?: (result: any) => void) =>
      this.handleCreatureAdd(socket, data, callback)
    );
    socket.on('creature:remove', (data: { id: string }, callback?: (result: any) => void) =>
      this.handleCreatureRemove(socket, data, callback)
    );

    // Turn management
    socket.on('turn:next', () => this.handleTurnNext(socket));
    socket.on('initiative:reorder', (data: { fromIndex: number; toIndex: number }) =>
      this.handleInitiativeReorder(socket, data)
    );

    // Timer management
    socket.on('timer:start', (data: { duration: number }) => this.handleTimerStart(socket, data));
    socket.on('timer:stop', () => this.handleTimerStop(socket));

    // Session management
    socket.on('session:reset', () => this.handleSessionReset(socket));
    socket.on('session:clear', () => this.handleSessionClear(socket));

    // Player turn management
    socket.on('turn:end', (data: { creatureId: string }) => this.handleTurnEnd(socket, data));
  }

  /**
   * Handle client identification
   */
  private handleIdentify(socket: Socket, data: { type: string; device_id?: string }): void {
    logger.info(`Client identified: ${socket.id}, type: ${data.type}`);

    // Store client metadata
    socket.data.clientType = data.type;
    socket.data.deviceId = data.device_id;

    // Join room based on client type
    socket.join(data.type);
    if (data.device_id) {
      socket.join(`device:${data.device_id}`);
    }

    // Send initial state
    socket.emit('identified', {
      status: 'ok',
      socket_id: socket.id,
    });

    // Send current state
    socket.emit('state:update', this.stateManager.getState());
  }

  /**
   * Handle state request
   */
  private handleStateRequest(socket: Socket): void {
    socket.emit('state:update', this.stateManager.getState());
  }

  /**
   * Handle add creature
   */
  private handleCreatureAdd(socket: Socket, data: Omit<Creature, 'id'>, callback?: (result: any) => void): void {
    try {
      const result = this.stateManager.addCreature(data);

      if (!result.success) {
        const errorResponse = {
          message: result.error?.message || 'Failed to add creature',
          code: 'VALIDATION_ERROR',
          details: result.error,
          event: 'creature:add'
        };
        socket.emit('error', errorResponse);
        if (callback) callback({ success: false, error: errorResponse.message });
        return;
      }

      logger.info(`Creature added: ${data.name} (initiative: ${data.initiative})`);
      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error('Error in creature:add:', error);
      const errorResponse = {
        message: error.message || 'Internal server error',
        event: 'creature:add'
      };
      socket.emit('error', errorResponse);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Handle remove creature
   */
  private handleCreatureRemove(socket: Socket, data: { id: string }, callback?: (result: any) => void): void {
    try {
      const result = this.stateManager.removeCreature(data.id);

      if (!result.success) {
        const errorResponse = {
          message: result.error?.message || 'Failed to remove creature',
          code: 'VALIDATION_ERROR',
          details: result.error,
          event: 'creature:remove'
        };
        socket.emit('error', errorResponse);
        if (callback) callback({ success: false, error: errorResponse.message });
        return;
      }

      logger.info(`Creature removed: ${data.id}`);
      if (callback) callback({ success: true });
    } catch (error: any) {
      logger.error('Error in creature:remove:', error);
      const errorResponse = {
        message: error.message || 'Internal server error',
        event: 'creature:remove'
      };
      socket.emit('error', errorResponse);
      if (callback) callback({ success: false, error: error.message });
    }
  }

  /**
   * Handle next turn
   */
  private handleTurnNext(socket: Socket): void {
    const result = this.stateManager.nextTurn();

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to advance turn',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    const state = this.stateManager.getState();
    const currentCreature = state.creatures[state.currentTurnIndex];
    logger.info(
      `Turn advanced: Round ${state.currentRound}, ${currentCreature?.name || 'N/A'} (${state.currentTurnIndex + 1}/${state.creatures.length})`
    );
  }

  /**
   * Handle initiative reorder
   */
  private handleInitiativeReorder(socket: Socket, data: { fromIndex: number; toIndex: number }): void {
    const result = this.stateManager.reorderInitiative(data.fromIndex, data.toIndex);

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to reorder initiative',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Initiative reordered: moved from ${data.fromIndex} to ${data.toIndex}`);
  }

  /**
   * Handle timer start
   */
  private handleTimerStart(socket: Socket, data: { duration: number }): void {
    const result = this.stateManager.startTimer(data.duration);

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to start timer',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Timer started: ${data.duration} seconds`);
  }

  /**
   * Handle timer stop
   */
  private handleTimerStop(socket: Socket): void {
    const result = this.stateManager.stopTimer();

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to stop timer',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Timer stopped`);
  }

  /**
   * Handle session reset
   */
  private handleSessionReset(socket: Socket): void {
    const result = this.stateManager.reset();

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to reset session',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Session reset`);
  }

  /**
   * Handle session clear (same as reset but no confirmation expected on client)
   */
  private handleSessionClear(socket: Socket): void {
    const result = this.stateManager.reset();

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to clear session',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Session cleared`);
  }

  /**
   * Handle turn end from player device
   */
  private handleTurnEnd(socket: Socket, data: { creatureId: string }): void {
    // Validate creature exists and is current turn
    const state = this.stateManager.getState();

    // Check if combat has started
    if (state.currentRound === 0 || state.currentTurnIndex < 0) {
      socket.emit('error', {
        message: 'Cannot end turn: combat has not started',
        code: 'VALIDATION_ERROR',
        details: { creatureId: data.creatureId },
      });
      return;
    }

    const currentCreature = state.creatures[state.currentTurnIndex];

    if (!currentCreature || currentCreature.id !== data.creatureId) {
      socket.emit('error', {
        message: 'Cannot end turn: creature is not the current turn',
        code: 'VALIDATION_ERROR',
        details: { creatureId: data.creatureId },
      });
      return;
    }

    // Advance turn automatically
    const result = this.stateManager.nextTurn();

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to advance turn',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    logger.info(`Turn ended by player: ${currentCreature.name}`);
  }
}
