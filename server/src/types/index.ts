/**
 * Core type definitions for the Initiative Tracker system
 */

export type CreatureType = 'player' | 'npc' | 'monster';

export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: CreatureType;
  hp?: number;
  maxHp?: number;
  conditions?: string[];
  imageUrl?: string;  // URL or data URI for creature avatar
  device_id?: string;
}

export interface Timer {
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
}

export interface GameState {
  creatures: Creature[];
  currentTurnIndex: number;
  currentRound: number;
  timer: Timer | null;
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
