/**
 * StateManager - Centralized state management for initiative tracking
 *
 * Implements singleton pattern to ensure single source of truth.
 * Provides methods for state mutations with validation and event emission.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Creature, StateUpdateResult, CreatureType } from '../types';
import { ValidationUtils } from '../utils/validation';
import { RedisClient } from '../persistence/RedisClient';
import { logger } from '../utils/logger';

export class StateManager extends EventEmitter {
  private static instance: StateManager;
  private state: GameState;
  private redis: RedisClient;
  private readonly STATE_KEY = 'initiative-tracker:state';

  private constructor() {
    super();
    this.redis = RedisClient.getInstance();
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
    return {
      creatures: [],
      currentTurnIndex: -1, // -1 indicates no combat has started
      currentRound: 0,      // 0 indicates combat hasn't started yet
      timer: null,
    };
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): Readonly<GameState> {
    return JSON.parse(JSON.stringify(this.state)) as GameState;
  }

  /**
   * Load state from Redis
   */
  public async loadFromRedis(): Promise<boolean> {
    if (!this.redis.isConnected()) {
      logger.warn('Redis not connected, skipping state load');
      return false;
    }

    try {
      const savedState = await this.redis.load<GameState>(this.STATE_KEY);

      if (savedState) {
        this.state = savedState;
        logger.info('State loaded from Redis successfully');
        this.emit('stateChanged', this.getState());
        return true;
      }

      logger.info('No saved state found in Redis');
      return false;
    } catch (error) {
      logger.error('Failed to load state from Redis', error);
      return false;
    }
  }

  /**
   * Save state to Redis
   */
  private async saveToRedis(): Promise<void> {
    if (!this.redis.isConnected()) {
      logger.debug('Redis not connected, skipping state save');
      return;
    }

    try {
      await this.redis.save(this.STATE_KEY, this.state);
      logger.debug('State saved to Redis');
    } catch (error) {
      logger.error('Failed to save state to Redis', error);
    }
  }

  /**
   * Update state and emit change event
   */
  private updateState(updater: (state: GameState) => void): void {
    updater(this.state);
    this.emit('stateChanged', this.getState());
    // Save to Redis after state change
    this.saveToRedis().catch((err) => {
      logger.error('Failed to save state to Redis after update', err);
    });
  }

  /**
   * Get creature type priority for initiative tie-breaking
   * Lower number = higher priority (goes first)
   */
  private getTypePriority(type: CreatureType): number {
    switch (type) {
      case 'player':
        return 1;
      case 'monster':
        return 2;
      case 'npc':
        return 3;
      default:
        return 4;
    }
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
      // Find the correct position for the creature
      // Sort by initiative (descending), then by type priority (ascending)
      let insertIndex = -1;

      for (let i = 0; i < state.creatures.length; i++) {
        const existingCreature = state.creatures[i];

        // If new creature has higher initiative, insert here
        if (creature.initiative > existingCreature.initiative) {
          insertIndex = i;
          break;
        }

        // If initiatives are tied, sort by creature type
        if (creature.initiative === existingCreature.initiative) {
          const newTypePriority = this.getTypePriority(creature.type);
          const existingTypePriority = this.getTypePriority(existingCreature.type);

          // If new creature has higher priority (lower number), insert here
          if (newTypePriority < existingTypePriority) {
            insertIndex = i;
            break;
          }
        }
      }

      if (insertIndex === -1) {
        // Add to the end if no better position found
        state.creatures.push(creature);
      } else {
        // Insert at the found position
        state.creatures.splice(insertIndex, 0, creature);
      }

      // Adjust currentTurnIndex if we inserted before current turn AND combat has started
      if (state.currentRound > 0 && insertIndex !== -1 && insertIndex <= state.currentTurnIndex) {
        state.currentTurnIndex++;
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

    const creatureIndex = this.state.creatures.findIndex((c) => c.id === creatureId);

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
      state.creatures.splice(creatureIndex, 1);

      // Adjust currentTurnIndex if needed
      if (state.creatures.length === 0) {
        // No creatures left, reset combat state
        state.currentTurnIndex = -1;
        state.currentRound = 0;
      } else if (state.currentRound > 0) {
        // Only adjust index if combat has started
        if (creatureIndex < state.currentTurnIndex) {
          state.currentTurnIndex--;
        } else if (creatureIndex === state.currentTurnIndex) {
          // If we removed the current creature, keep index but it now points to next creature
          // Unless we removed the last creature, then wrap around
          if (state.currentTurnIndex >= state.creatures.length) {
            state.currentTurnIndex = 0;
          }
        }
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Advance to next turn
   */
  nextTurn(): StateUpdateResult {
    if (this.state.creatures.length === 0) {
      return {
        success: false,
        error: {
          field: 'creatures',
          message: 'Cannot advance turn: no creatures in initiative',
        },
      };
    }

    this.updateState((state) => {
      // If combat hasn't started yet, start it
      if (state.currentRound === 0) {
        state.currentRound = 1;
        state.currentTurnIndex = 0;
      } else {
        state.currentTurnIndex++;

        // Wrap around and increment round
        if (state.currentTurnIndex >= state.creatures.length) {
          state.currentTurnIndex = 0;
          state.currentRound++;
        }
      }

      // Reset timer on turn change
      if (state.timer) {
        state.timer.isActive = false;
        state.timer.remainingSeconds = 0;
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Reorder initiative
   */
  reorderInitiative(fromIndex: number, toIndex: number): StateUpdateResult {
    // Validate indices
    if (
      fromIndex < 0 ||
      fromIndex >= this.state.creatures.length ||
      toIndex < 0 ||
      toIndex >= this.state.creatures.length
    ) {
      return {
        success: false,
        error: {
          field: 'index',
          message: 'Invalid index for reordering',
        },
      };
    }

    if (fromIndex === toIndex) {
      return { success: true, state: this.getState() };
    }

    this.updateState((state) => {
      const creature = state.creatures[fromIndex];
      state.creatures.splice(fromIndex, 1);
      state.creatures.splice(toIndex, 0, creature);

      // Only update currentTurnIndex if combat has started
      if (state.currentRound > 0 && state.currentTurnIndex >= 0) {
        // Update currentTurnIndex if affected by the reorder
        if (state.currentTurnIndex === fromIndex) {
          state.currentTurnIndex = toIndex;
        } else if (fromIndex < state.currentTurnIndex && toIndex >= state.currentTurnIndex) {
          state.currentTurnIndex--;
        } else if (fromIndex > state.currentTurnIndex && toIndex <= state.currentTurnIndex) {
          state.currentTurnIndex++;
        }
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
      state.timer = {
        isActive: true,
        totalSeconds: duration,
        remainingSeconds: duration,
      };
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Stop timer
   */
  stopTimer(): StateUpdateResult {
    this.updateState((state) => {
      if (state.timer) {
        state.timer.isActive = false;
        state.timer.remainingSeconds = 0;
      }
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Tick timer (called every second)
   */
  tickTimer(): StateUpdateResult {
    if (!this.state.timer || !this.state.timer.isActive) {
      return { success: false, error: { field: 'timer', message: 'Timer is not active' } };
    }

    this.updateState((state) => {
      if (state.timer) {
        state.timer.remainingSeconds = Math.max(0, state.timer.remainingSeconds - 1);

        if (state.timer.remainingSeconds === 0) {
          state.timer.isActive = false;
          this.emit('timerExpired');
        }
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

  /**
   * Update creature properties
   */
  updateCreature(id: string, updates: Partial<Creature>): StateUpdateResult {
    const index = this.state.creatures.findIndex(c => c.id === id);
    if (index === -1) {
      return {
        success: false,
        error: {
          field: 'id',
          message: 'Creature not found',
          value: id,
        },
      };
    }

    const creature = { ...this.state.creatures[index], ...updates };
    const validationError = ValidationUtils.validateCreature(creature);
    if (validationError) {
      return { success: false, error: validationError };
    }

    this.updateState((state) => {
      state.creatures[index] = creature;
    });

    return { success: true, state: this.getState() };
  }

  /**
   * Get creature by ID
   */
  getCreature(id: string): Creature | undefined {
    return this.state.creatures.find(c => c.id === id);
  }

  /**
   * Get current turn creature
   */
  getCurrentCreature(): Creature | undefined {
    // Return undefined if combat hasn't started or index is invalid
    if (this.state.currentTurnIndex < 0 || this.state.currentTurnIndex >= this.state.creatures.length) {
      return undefined;
    }
    return this.state.creatures[this.state.currentTurnIndex];
  }
}
