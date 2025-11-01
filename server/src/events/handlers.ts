/**
 * WebSocket event handlers
 */

import { Socket, Server } from 'socket.io';
import { StateManager } from '../state/StateManager';
import { Creature } from '../types';

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
    socket.on('creature:add', (data: Omit<Creature, 'id'>) =>
      this.handleCreatureAdd(socket, data)
    );
    socket.on('creature:remove', (data: { id: string }) =>
      this.handleCreatureRemove(socket, data)
    );

    // Turn management
    socket.on('turn:next', () => this.handleTurnNext(socket));
    socket.on('initiative:reorder', (data: { order: string[] }) =>
      this.handleInitiativeReorder(socket, data)
    );

    // Timer management
    socket.on('timer:start', (data: { duration: number }) => this.handleTimerStart(socket, data));
    socket.on('timer:stop', () => this.handleTimerStop(socket));

    // Session management
    socket.on('session:reset', () => this.handleSessionReset(socket));
  }

  /**
   * Handle client identification
   */
  private handleIdentify(socket: Socket, data: { type: string; device_id?: string }): void {
    console.log(`Client identified: ${socket.id}, type: ${data.type}`);

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
  private handleCreatureAdd(socket: Socket, data: Omit<Creature, 'id'>): void {
    const result = this.stateManager.addCreature(data);

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to add creature',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    console.log(`Creature added: ${data.name} (initiative: ${data.initiative})`);
  }

  /**
   * Handle remove creature
   */
  private handleCreatureRemove(socket: Socket, data: { id: string }): void {
    const result = this.stateManager.removeCreature(data.id);

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to remove creature',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    console.log(`Creature removed: ${data.id}`);
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
    const currentCreature = state.initiative_order[state.current_turn_index];
    console.log(
      `Turn advanced: Round ${state.round}, ${currentCreature?.name || 'N/A'} (${state.current_turn_index + 1}/${state.initiative_order.length})`
    );
  }

  /**
   * Handle initiative reorder
   */
  private handleInitiativeReorder(socket: Socket, data: { order: string[] }): void {
    const result = this.stateManager.reorderInitiative(data.order);

    if (!result.success) {
      socket.emit('error', {
        message: result.error?.message || 'Failed to reorder initiative',
        code: 'VALIDATION_ERROR',
        details: result.error,
      });
      return;
    }

    console.log(`Initiative reordered`);
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

    console.log(`Timer started: ${data.duration} seconds`);
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

    console.log(`Timer stopped`);
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

    console.log(`Session reset`);
  }
}
