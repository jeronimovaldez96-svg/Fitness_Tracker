export type ProgressRange = '4W' | '12W' | '1Y';

export type VolumeSeries = {
  bars: number[];
  fromLabel: string;
  toLabel: string;
  deltaPercent: number;
};

export type LiftTrend = {
  exerciseId: string;
  name: string;
  latestE1rm: number;
  deltaKg: number;
  series: number[];
};

export type PersonalRecordEntry = {
  id: string;
  date: number;
  exerciseName: string;
  weightKg: number;
  reps: number;
};
