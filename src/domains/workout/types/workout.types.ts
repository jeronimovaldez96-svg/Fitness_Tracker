export type ActiveSet = {
  id: string;
  workoutExerciseId: string;
  setOrder: number;
  isCompleted: boolean;
  weightKg: number | null;
  reps: number | null;
  isPersonalRecord: boolean;
  ghostWeightKg: number | null;
  ghostReps: number | null;
  /** Uncommitted numeric-pad text. Empty string means "untouched" (show ghost/committed value). */
  draftWeight: string;
  draftReps: string;
};

export type ActiveWorkoutExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipmentId: string;
  /** e.g. "Last: 80 kg × 8" from the most recent completed session, or null if none / not applicable. */
  lastLabel: string | null;
  sets: ActiveSet[];
};

export type FocusedField = {
  setId: string;
  field: 'weight' | 'reps';
};
