import type { SQLiteDatabase } from 'expo-sqlite';

import { generateId } from '@/shared/utils/id';
import {
  MEASUREMENT_LABELS,
  MEASUREMENT_METRICS,
  type BodyweightTrend,
  type MeasurementRow,
} from '@/domains/workout/types/bodyMetrics.types';

const TREND_WEEKS = 12;
const TREND_WINDOW_MS = TREND_WEEKS * 7 * 24 * 60 * 60 * 1000;

export async function getBodyweightSeries(db: SQLiteDatabase): Promise<BodyweightTrend> {
  const rows = await db.getAllAsync<{ weight_kg: number; measured_at: number }>(
    `SELECT weight_kg, measured_at FROM body_metrics
     WHERE measured_at >= ?
     ORDER BY measured_at ASC`,
    [Date.now() - TREND_WINDOW_MS]
  );
  if (rows.length === 0) return { series: [], latestKg: null, deltaKg: null };

  const series = rows.map((row) => row.weight_kg);
  const latestKg = series[series.length - 1];
  const deltaKg = Math.round((latestKg - series[0]) * 10) / 10;
  return { series, latestKg, deltaKg };
}

export async function insertBodyweightEntry(
  db: SQLiteDatabase,
  params: { weightKg: number; bodyFatPercentage?: number | null; measuredAt: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO body_metrics (id, measured_at, weight_kg, body_fat_percentage) VALUES (?, ?, ?, ?)',
    generateId(),
    params.measuredAt,
    params.weightKg,
    params.bodyFatPercentage ?? null
  );
}

export async function getLatestMeasurements(db: SQLiteDatabase): Promise<MeasurementRow[]> {
  const rows: MeasurementRow[] = [];

  const weight = await getBodyweightSeries(db);
  if (weight.latestKg !== null) {
    rows.push({
      metric: 'weight',
      label: 'Weight',
      value: weight.latestKg,
      unit: 'kg',
      deltaValue: weight.deltaKg ?? 0,
    });
  }

  for (const metric of MEASUREMENT_METRICS) {
    const entries = await db.getAllAsync<{ value: number; unit: string; measured_at: number }>(
      `SELECT value, unit, measured_at FROM body_measurements
       WHERE metric = ? AND measured_at >= ?
       ORDER BY measured_at ASC`,
      [metric, Date.now() - TREND_WINDOW_MS]
    );
    if (entries.length === 0) continue;
    const latest = entries[entries.length - 1];
    const delta = Math.round((latest.value - entries[0].value) * 10) / 10;
    rows.push({
      metric,
      label: MEASUREMENT_LABELS[metric],
      value: latest.value,
      unit: latest.unit,
      deltaValue: delta,
    });
  }

  return rows;
}

export async function insertMeasurement(
  db: SQLiteDatabase,
  params: { metric: string; value: number; unit: string; measuredAt: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO body_measurements (id, metric, value, unit, measured_at) VALUES (?, ?, ?, ?, ?)',
    generateId(),
    params.metric,
    params.value,
    params.unit,
    params.measuredAt
  );
}
