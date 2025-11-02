// D&D 5E Status Conditions
export const DND5E_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Concentrating',
  'Dodging',
  'Hasted',
  'Blessed',
  'Slowed'
] as const;

export type Condition = typeof DND5E_CONDITIONS[number];

export interface ConditionEffect {
  condition: Condition;
  duration?: number; // rounds remaining, undefined = until removed
  source?: string; // spell/ability name
  addedAt: string; // ISO timestamp
}
