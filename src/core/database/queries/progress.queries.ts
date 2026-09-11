import type { SQLiteDatabase } from 'expo-sqlite';

import { addMonths, addWeeks, startOfMonth, startOfWeek } from '@/shared/utils/dateBuckets';
import { formatAxisDate } from '@/shared/utils/formatDate';
import { calculateE1RM, MAX_REPS_FOR_ESTIMATE } from '@/shared/utils/oneRepMax';
import type { LiftTrend, PersonalRecordEntry, ProgressRange, VolumeSeries } from '@/domains/workout/types/progress.types';

const TOP_LIFTS_COUNT = 4;
const TREND_BUCKETS = 7;

function rangeToBucketCount(range: ProgressRange): number {
  return range === '4W' ? 4 : range === '12W' ? 12 : 12;
}

function percentDelta(first: number, last: number): number {
  if (first <= 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
}

export async function getVolumeSeries(db: SQLiteDatabase, range: ProgressRange): Promise<VolumeSeries> {
  const bucketCount = rangeToBucketCount(range);
  const isYearly = range === '1Y';

  const rangeStart = isYearly
    ? addMonths(startOfMonth(Date.now()), -(bucketCount - 1))
    : addWeeks(startOfWeek(Date.now()), -(bucketCount - 1));

  const rows = await db.getAllAsync<{ completed_at: number; weight_kg: number | null; reps: number | null }>(
    `SELECT ws.completed_at, ws.weight_kg, ws.reps
     FROM workout_sets ws
     WHERE ws.is_completed = 1 AND ws.completed_at >= ?`,
    [rangeStart]
  );

  const buckets = new Map<number, number>();
  for (let i = 0; i < bucketCount; i++) {
    const key = isYearly ? addMonths(rangeStart, i) : addWeeks(rangeStart, i);
    buckets.set(key, 0);
  }

  for (const row of rows) {
    if (row.weight_kg === null || row.reps === null) continue;
    const key = isYearly ? startOfMonth(row.completed_at) : startOfWeek(row.completed_at);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + row.weight_kg * row.reps);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a - b);
  const bars = sorted.map(([, volumeKg]) => volumeKg);

  return {
    bars,
    fromLabel: formatAxisDate(sorted[0]?.[0] ?? rangeStart),
    toLabel: formatAxisDate(Date.now()),
    deltaPercent: percentDelta(bars[0] ?? 0, bars[bars.length - 1] ?? 0),
  };
}

export async function getTopLiftsWithE1RMTrend(db: SQLiteDatabase, range: ProgressRange): Promise<LiftTrend[]> {
  const bucketCount = rangeToBucketCount(range);
  const rangeStart = range === '1Y'
    ? addMonths(startOfMonth(Date.now()), -(bucketCount - 1))
    : addWeeks(startOfWeek(Date.now()), -(bucketCount - 1));

  const topExercises = await db.getAllAsync<{ exercise_id: string; exercise_name: string; set_count: number }>(
    `SELECT we.exercise_id, ex.name as exercise_name, COUNT(ws.id) as set_count
     FROM workout_sets ws
     JOIN workout_exercises we ON we.id = ws.workout_exercise_id
     JOIN exercises ex ON ex.id = we.exercise_id
     WHERE ws.is_completed = 1 AND ws.reps > 0 AND ws.reps <= ?
     GROUP BY we.exercise_id
     ORDER BY set_count DESC
     LIMIT ?`,
    [MAX_REPS_FOR_ESTIMATE, TOP_LIFTS_COUNT]
  );

  const trends: LiftTrend[] = [];
  for (const lift of topExercises) {
    const sets = await db.getAllAsync<{ completed_at: number; weight_kg: number; reps: number }>(
      `SELECT ws.completed_at, ws.weight_kg, ws.reps
       FROM workout_sets ws
       JOIN workout_exercises we ON we.id = ws.workout_exercise_id
       WHERE we.exercise_id = ? AND ws.is_completed = 1 AND ws.reps > 0 AND ws.reps <= ?
             AND ws.weight_kg IS NOT NULL AND ws.completed_at >= ?
       ORDER BY ws.completed_at ASC`,
      [lift.exercise_id, MAX_REPS_FOR_ESTIMATE, rangeStart]
    );
    if (sets.length === 0) continue;

    const bucketSpanMs = (Date.now() - rangeStart) / TREND_BUCKETS;
    const buckets = new Array<number>(TREND_BUCKETS).fill(0);
    for (const set of sets) {
      const e1rm = calculateE1RM(set.weight_kg, set.reps);
      if (e1rm === null) continue;
      const bucketIndex = Math.min(
        TREND_BUCKETS - 1,
        Math.max(0, Math.floor((set.completed_at - rangeStart) / bucketSpanMs))
      );
      buckets[bucketIndex] = Math.max(buckets[bucketIndex], e1rm);
    }
    // Carry the last known value forward into empty buckets so the sparkline
    // doesn't fall to zero between training sessions.
    let carry = 0;
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i] > 0) carry = buckets[i];
      else buckets[i] = carry;
    }
    const firstNonZeroIndex = buckets.findIndex((v) => v > 0);
    const series = firstNonZeroIndex === -1 ? buckets : buckets.slice(firstNonZeroIndex);
    const latestE1rm = series[series.length - 1] ?? 0;
    const previous = series.length > 1 ? series[0] : latestE1rm;

    trends.push({
      exerciseId: lift.exercise_id,
      name: lift.exercise_name,
      latestE1rm: Math.round(latestE1rm * 10) / 10,
      deltaKg: Math.round((latestE1rm - previous) * 10) / 10,
      series,
    });
  }
  return trends;
}

export async function getRecentPersonalRecords(db: SQLiteDatabase, limit: number): Promise<PersonalRecordEntry[]> {
  const rows = await db.getAllAsync<{
    id: string;
    completed_at: number;
    exercise_name: string;
    weight_kg: number;
    reps: number;
  }>(
    `SELECT ws.id, ws.completed_at, ex.name as exercise_name, ws.weight_kg, ws.reps
     FROM workout_sets ws
     JOIN workout_exercises we ON we.id = ws.workout_exercise_id
     JOIN exercises ex ON ex.id = we.exercise_id
     WHERE ws.is_personal_record = 1
     ORDER BY ws.completed_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    date: row.completed_at,
    exerciseName: row.exercise_name,
    weightKg: row.weight_kg,
    reps: row.reps,
  }));
}
