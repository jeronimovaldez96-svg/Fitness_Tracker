export type BodyweightTrend = {
  series: number[];
  latestKg: number | null;
  deltaKg: number | null;
};

export type MeasurementRow = {
  metric: string;
  label: string;
  value: number;
  unit: string;
  deltaValue: number;
};

export const MEASUREMENT_METRICS = ['waist', 'chest', 'upper_arm', 'thigh'] as const;
export type MeasurementMetric = (typeof MEASUREMENT_METRICS)[number];

export const MEASUREMENT_LABELS: Record<MeasurementMetric, string> = {
  waist: 'Waist',
  chest: 'Chest',
  upper_arm: 'Upper arm',
  thigh: 'Thigh',
};
