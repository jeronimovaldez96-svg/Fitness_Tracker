export type SessionSummary = {
  id: string;
  title: string;
  startTime: number;
  durationMinutes: number;
  setCount: number;
  volumeKg: number;
  prCount: number;
};

export type MonthStats = {
  sessionCount: number;
  setCount: number;
  volumeKg: number;
};

export type WorkoutSetDetail = {
  id: string;
  setOrder: number;
  weightKg: number | null;
  reps: number | null;
  isPersonalRecord: boolean;
};

export type WorkoutExerciseDetail = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  equipmentId: string;
  sets: WorkoutSetDetail[];
};

export type WorkoutDetail = {
  id: string;
  title: string;
  startTime: number;
  endTime: number | null;
  durationMinutes: number;
  exercises: WorkoutExerciseDetail[];
  setCount: number;
  volumeKg: number;
  topSetWeightKg: number | null;
  prCount: number;
};

export type WeeklyVolumePoint = {
  weekStart: number;
  volumeKg: number;
};
