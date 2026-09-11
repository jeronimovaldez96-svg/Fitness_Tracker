/**
 * Derives a "form guide" illustration key from data the catalog already
 * stores (primary muscle + equipment) instead of a per-exercise asset column.
 * There's no meaningful art difference between e.g. Barbell Bench Press and
 * Incline Barbell Press for a first-pass placeholder illustration, so
 * exercises are grouped into movement-pattern/equipment-family combos
 * (~15 illustrations) rather than needing one asset per exercise.
 */

export type MovementPattern = 'press' | 'pull' | 'legs' | 'core';
export type EquipmentFamily = 'bar' | 'handheld' | 'cable' | 'machine' | 'bodyweight';

const PULL_MUSCLES = new Set(['back', 'lats', 'biceps', 'traps', 'forearms']);
const LEG_MUSCLES = new Set(['quads', 'hamstrings', 'glutes', 'calves']);
const CORE_MUSCLES = new Set(['abs', 'obliques']);

/** Chest/shoulders/triceps (and anything unmapped) default to 'press'. */
export function getMovementPattern(primaryMuscleId: string): MovementPattern {
  if (LEG_MUSCLES.has(primaryMuscleId)) return 'legs';
  if (CORE_MUSCLES.has(primaryMuscleId)) return 'core';
  if (PULL_MUSCLES.has(primaryMuscleId)) return 'pull';
  return 'press';
}

const EQUIPMENT_FAMILY: Record<string, EquipmentFamily> = {
  barbell: 'bar',
  'ez-bar': 'bar',
  'smith-machine': 'bar',
  'trap-bar': 'bar',
  dumbbell: 'handheld',
  kettlebell: 'handheld',
  cable: 'cable',
  band: 'cable',
  machine: 'machine',
  bodyweight: 'bodyweight',
};

export function getEquipmentFamily(equipmentId: string): EquipmentFamily {
  return EQUIPMENT_FAMILY[equipmentId] ?? 'machine';
}

export function getFormGuideKey(primaryMuscleId: string, equipmentId: string): string {
  return `${getEquipmentFamily(equipmentId)}-${getMovementPattern(primaryMuscleId)}`;
}
