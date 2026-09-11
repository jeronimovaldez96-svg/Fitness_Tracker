const BRZYCKI_MAX_REPS = 10;
export const MAX_REPS_FOR_ESTIMATE = 30;

/**
 * TRD 7.3: estimated 1RM. Brzycki is used up to 10 reps (its intended range);
 * above that it blows up as reps approaches 37, so heavier, higher-rep sets
 * switch to Epley, which stays well-behaved further into higher rep ranges.
 * Beyond MAX_REPS_FOR_ESTIMATE neither formula is reliable enough to trust.
 */
export function calculateE1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps <= BRZYCKI_MAX_REPS) return weightKg * (36 / (37 - reps));
  return weightKg * (1 + reps / 30);
}
