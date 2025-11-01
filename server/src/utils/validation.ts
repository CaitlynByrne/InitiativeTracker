/**
 * Input validation utilities
 */

import { Creature, ValidationError } from '../types';

export class ValidationUtils {
  /**
   * Validate creature data
   */
  static validateCreature(data: Partial<Creature>): ValidationError | null {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return {
        field: 'name',
        message: 'Creature name is required and must be a non-empty string',
        value: data.name,
      };
    }

    if (typeof data.initiative !== 'number' || isNaN(data.initiative)) {
      return {
        field: 'initiative',
        message: 'Initiative must be a valid number',
        value: data.initiative,
      };
    }

    if (data.initiative < 1 || data.initiative > 30) {
      return {
        field: 'initiative',
        message: 'Initiative must be between 1 and 30',
        value: data.initiative,
      };
    }

    if (!data.type || !['player', 'npc', 'monster'].includes(data.type)) {
      return {
        field: 'type',
        message: 'Creature type must be "player", "npc", or "monster"',
        value: data.type,
      };
    }

    return null;
  }

  /**
   * Validate timer duration
   */
  static validateTimerDuration(duration: number): ValidationError | null {
    if (typeof duration !== 'number' || isNaN(duration)) {
      return {
        field: 'duration',
        message: 'Timer duration must be a valid number',
        value: duration,
      };
    }

    if (duration <= 0 || duration > 3600) {
      return {
        field: 'duration',
        message: 'Timer duration must be between 1 and 3600 seconds',
        value: duration,
      };
    }

    return null;
  }

  /**
   * Validate creature ID
   */
  static validateCreatureId(id: unknown): ValidationError | null {
    if (typeof id !== 'string' || id.trim().length === 0) {
      return {
        field: 'id',
        message: 'Creature ID must be a non-empty string',
        value: id,
      };
    }

    return null;
  }
}
