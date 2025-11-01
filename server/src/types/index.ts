/**
 * Core type definitions for the Initiative Tracker system
 */

export type CreatureType = 'player' | 'npc';

export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: CreatureType;
  device_id?: string;
}

export interface Timer {
  active: boolean;
  remaining: number;
  duration: number;
}

export interface GameStateMetadata {
  created_at: string;
  last_modified: string;
}

export interface GameState {
  session_id: string;
  current_turn_index: number;
  round: number;
  timer: Timer;
  initiative_order: Creature[];
  metadata: GameStateMetadata;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface StateUpdateResult {
  success: boolean;
  state?: GameState;
  error?: ValidationError;
}
