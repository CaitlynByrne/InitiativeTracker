/**
 * StateManager - Centralized state management for initiative tracking
 *
 * Implements singleton pattern to ensure single source of truth.
 * Provides methods for state mutations with validation and event emission.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Creature, StateUpdateResult } from '../types';
import { ValidationUtils } from '../utils/validation';

export class StateManager extends EventEmitter {
  private static instance: StateManager;
  private state: GameState;

  private constructor() {
    super();
    this.state = this.createDefaultState();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Create default empty state
   */
  private createDefaultState(): GameState {
    const now = new Date().toISOString();
    return {
      session_id: uuidv4(),
      current_turn_index: 0,
      round: 1,
      timer: {
        active: false,
        remaining: 0,
        duration: 0,
      },
      initiative_order: [],
      metadata: {
        created_at: now,
        last_modified: now,
      },
    };
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): Readonly<GameState> {
    return JSON.parse(JSON.stringify(this.state)) as GameState;
  }

  /**
   * Update state and emit change event
   */
  private updateState(updater: (state: GameState) => void): void {
    updater(this.state);
    this.state.metadata.last_modified = new Date().toISOString();
    this.emit('stateChanged', this.getState());
  }

  /**
   * Add creature to initiative order
   */
  addCreature(creatureData: Omit<Creature, 'id'>): StateUpdateResult {
    // Validate creature data
    const validationError = ValidationUtils.validateCreature(creatureData);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const creature: Creature = {
      id: uuidv4(),
      ...creatureData,
      name: creatureData.name.trim(),
    };

    this.updateState((state) => {
      // Insert creature in initiative order (sorted by initiative, descending)
      const insertIndex = state.initiative_order.findIndex(
        (c) => c.initiative < creature.initiative
      );

      if (insertIndex === -1) {
        state.initiative_order.push(creature);
      } else {
        state.initiative_order.splice(insertIndex, 0, creature);
      }

      // Adjust current_turn_index if we inserted before current turn
      if (insertIndex !== -1 && insertIndex <= state.current_turn_index) {
        state.current_turn_index++;
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Remove creature from initiative order
   */
  removeCreature(creatureId: string): StateUpdateResult {
    // Validate ID
    const validationError = ValidationUtils.validateCreatureId(creatureId);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const creatureIndex = this.state.initiative_order.findIndex((c) => c.id === creatureId);

    if (creatureIndex === -1) {
      return {
        success: false,
        error: {
          field: 'id',
          message: 'Creature not found',
          value: creatureId,
        },
      };
    }

    this.updateState((state) => {
      state.initiative_order.splice(creatureIndex, 1);

      // Adjust current_turn_index if needed
      if (state.initiative_order.length === 0) {
        state.current_turn_index = 0;
      } else if (creatureIndex < state.current_turn_index) {
        state.current_turn_index--;
      } else if (creatureIndex === state.current_turn_index) {
        // If we removed the current creature, keep index but it now points to next creature
        // Unless we removed the last creature, then wrap around
        if (state.current_turn_index >= state.initiative_order.length) {
          state.current_turn_index = 0;
        }
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Advance to next turn
   */
  nextTurn(): StateUpdateResult {
    if (this.state.initiative_order.length === 0) {
      return {
        success: false,
        error: {
          field: 'initiative_order',
          message: 'Cannot advance turn: no creatures in initiative',
        },
      };
    }

    this.updateState((state) => {
      state.current_turn_index++;

      // Wrap around and increment round
      if (state.current_turn_index >= state.initiative_order.length) {
        state.current_turn_index = 0;
        state.round++;
      }

      // Reset timer on turn change
      state.timer.active = false;
      state.timer.remaining = 0;
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Reorder initiative
   */
  reorderInitiative(newOrder: string[]): StateUpdateResult {
    // Validate that newOrder contains same creatures
    if (newOrder.length !== this.state.initiative_order.length) {
      return {
        success: false,
        error: {
          field: 'order',
          message: 'New order must contain all creatures',
        },
      };
    }

    const currentIds = new Set(this.state.initiative_order.map((c) => c.id));
    const newIds = new Set(newOrder);

    if (currentIds.size !== newIds.size || ![...currentIds].every((id) => newIds.has(id))) {
      return {
        success: false,
        error: {
          field: 'order',
          message: 'New order must contain exactly the same creature IDs',
        },
      };
    }

    // Find current creature to preserve turn
    const currentCreatureId = this.state.initiative_order[this.state.current_turn_index]?.id;

    this.updateState((state) => {
      // Reorder creatures
      const creatureMap = new Map(state.initiative_order.map((c) => [c.id, c]));
      state.initiative_order = newOrder.map((id) => creatureMap.get(id)!);

      // Update current_turn_index to point to same creature
      if (currentCreatureId) {
        state.current_turn_index = state.initiative_order.findIndex(
          (c) => c.id === currentCreatureId
        );
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Start timer
   */
  startTimer(duration: number): StateUpdateResult {
    const validationError = ValidationUtils.validateTimerDuration(duration);
    if (validationError) {
      return { success: false, error: validationError };
    }

    this.updateState((state) => {
      state.timer.active = true;
      state.timer.duration = duration;
      state.timer.remaining = duration;
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Stop timer
   */
  stopTimer(): StateUpdateResult {
    this.updateState((state) => {
      state.timer.active = false;
      state.timer.remaining = 0;
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Tick timer (called every second)
   */
  tickTimer(): StateUpdateResult {
    if (!this.state.timer.active) {
      return { success: false, error: { field: 'timer', message: 'Timer is not active' } };
    }

    this.updateState((state) => {
      state.timer.remaining = Math.max(0, state.timer.remaining - 1);

      if (state.timer.remaining === 0) {
        state.timer.active = false;
        this.emit('timerExpired');
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Reset state to default
   */
  reset(): StateUpdateResult {
    this.state = this.createDefaultState();
    this.emit('stateChanged', this.getState());
    return { success: true, state: this.getState() };
  }

  /**
   * Load state (for persistence restore)
   */
  loadState(state: GameState): void {
    this.state = state;
    this.emit('stateChanged', this.getState());
  }
}
