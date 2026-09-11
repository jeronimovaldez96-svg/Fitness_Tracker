export type RoutineSummary = {
  id: string;
  name: string;
  cycleLabel: string | null;
  dayLabel: string | null;
  exerciseCount: number;
  estimatedMinutes: number;
  lastUsedAt: number | null;
  isNext: boolean;
};

export type RoutineExerciseDetail = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipmentId: string;
  equipmentName: string;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  targetWeightKg: number | null;
};

export type RoutineDetail = {
  id: string;
  name: string;
  cycleLabel: string | null;
  dayLabel: string | null;
  lastUsedAt: number | null;
  exercises: RoutineExerciseDetail[];
};

export type RoutineExerciseInput = {
  exerciseId: string;
  targetSets: number;
  targetReps: string;
  targetWeightKg: number | null;
};
