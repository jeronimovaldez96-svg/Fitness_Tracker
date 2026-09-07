import { roundTo1Decimal, type UnitSystem } from './units';

export type PlateBreakdown = {
  barWeight: number;
  plates: { size: number; count: number }[];
  /** Leftover per-side weight that the available plate set can't make up exactly. */
  remainder: number;
};

const STANDARD_BAR_KG = 20;
const STANDARD_BAR_LBS = 45;

const PLATE_SIZES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_SIZES_LBS = [45, 35, 25, 10, 5, 2.5];

const EPSILON = 1e-9;

/**
 * Breaks a total barbell weight down into plates required per side, assuming
 * the TRD-specified standard 20kg / 45lb bar.
 */
export function calculatePlatesPerSide(totalWeight: number, unit: UnitSystem): PlateBreakdown {
  const barWeight = unit === 'imperial' ? STANDARD_BAR_LBS : STANDARD_BAR_KG;
  const plateSizes = unit === 'imperial' ? PLATE_SIZES_LBS : PLATE_SIZES_KG;

  let perSide = Math.max(0, (totalWeight - barWeight) / 2);
  const plates: { size: number; count: number }[] = [];

  for (const size of plateSizes) {
    const count = Math.floor(perSide / size + EPSILON);
    if (count > 0) {
      plates.push({ size, count });
      perSide -= count * size;
    }
  }

  return { barWeight, plates, remainder: roundTo1Decimal(perSide) };
}
