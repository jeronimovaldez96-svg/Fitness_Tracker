const MAX_REPS_FOR_E1RM = 10;

/** TRD 7.3: Brzycki formula, only valid for completed sets with reps <= 10. */
export function calculateE1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_E1RM) return null;
  return weightKg * (36 / (37 - reps));
}
