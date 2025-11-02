export interface Creature {
  id: string;
  name: string;
  initiative: number;
  type: 'player' | 'npc' | 'monster';
  hp?: number;
  maxHp?: number;
  conditions?: string[];
  imageUrl?: string;  // URL or data URI for creature avatar
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