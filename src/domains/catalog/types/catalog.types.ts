export type MetricType = 'weight_reps' | 'reps_only' | 'duration_reps' | 'duration_distance';

export type MuscleGroup = {
  id: string;
  name: string;
  bodyRegion: 'upper' | 'lower' | 'core';
};

export type Equipment = {
  id: string;
  name: string;
};

export type ExerciseSummary = {
  id: string;
  name: string;
  primaryMuscleId: string;
  secondaryMuscleId: string | null;
  equipmentId: string;
  metricType: MetricType;
};

export type ExerciseSearchFilters = {
  primaryMuscleId?: string;
  equipmentId?: string;
};
