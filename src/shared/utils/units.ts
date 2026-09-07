export type UnitSystem = 'metric' | 'imperial';

const KG_TO_LBS = 2.2046226218;

export function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return roundTo1Decimal(kg * KG_TO_LBS);
}

export function lbsToKg(lbs: number): number {
  return roundTo1Decimal(lbs / KG_TO_LBS);
}

/** Converts a kg value (as stored in SQLite) to the given display unit, rounded to 1 decimal. */
export function displayWeight(weightKg: number, unit: UnitSystem): number {
  return unit === 'imperial' ? kgToLbs(weightKg) : roundTo1Decimal(weightKg);
}

/** Converts a value entered in the given display unit back to kg for storage. */
export function toStorageKg(displayValue: number, unit: UnitSystem): number {
  return unit === 'imperial' ? lbsToKg(displayValue) : roundTo1Decimal(displayValue);
}
