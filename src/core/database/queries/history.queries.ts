import type { SQLiteDatabase } from 'expo-sqlite';

import { addWeeks, startOfWeek } from '@/shared/utils/dateBuckets';
import type {
  MonthStats,
  SessionSummary,
  WeeklyVolumePoint,
  WorkoutDetail,
} from '@/domains/workout/types/history.types';

function toMinutes(startTime: number, endTime: number | null): number {
  if (endTime === null) return 0;
  return Math.max(0, Math.round((endTime - startTime) / 60000));
}

type SessionRow = {
  id: string;
  title: string;
  start_time: number;
  end_time: number | null;
  set_count: number;
  volume_kg: number;
  pr_count: number;
};

function mapSessionRow(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    title: row.title,
    startTime: row.start_time,
    durationMinutes: toMinutes(row.start_time, row.end_time),
    setCount: row.set_count,
    volumeKg: row.volume_kg,
    prCount: row.pr_count,
  };
}

const SESSION_AGGREGATE_SQL = `
  SELECT w.id, w.title, w.start_time, w.end_time,
         COUNT(ws.id) as set_count,
         COALESCE(SUM(ws.weight_kg * ws.reps), 0) as volume_kg,
         COALESCE(SUM(ws.is_personal_record), 0) as pr_count
  FROM workouts w
  JOIN workout_exercises we ON we.workout_id = w.id
  JOIN workout_sets ws ON ws.workout_exercise_id = we.id AND ws.is_completed = 1
  WHERE w.end_time IS NOT NULL
`;

export async function listRecentSessions(db: SQLiteDatabase, limit: number): Promise<SessionSummary[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `${SESSION_AGGREGATE_SQL} GROUP BY w.id ORDER BY w.start_time DESC LIMIT ?`,
    [limit]
  );
  return rows.map(mapSessionRow);
}

export async function listSessionsInRange(
  db: SQLiteDatabase,
  rangeStart: number,
  rangeEnd: number
): Promise<SessionSummary[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `${SESSION_AGGREGATE_SQL} AND w.start_time >= ? AND w.start_time < ? GROUP BY w.id ORDER BY w.start_time DESC`,
    [rangeStart, rangeEnd]
  );
  return rows.map(mapSessionRow);
}

export async function getSessionsThisWeekCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE end_time IS NOT NULL AND start_time >= ?',
    [startOfWeek(Date.now())]
  );
  return row?.count ?? 0;
}

export async function getWorkoutDetail(db: SQLiteDatabase, workoutId: string): Promise<WorkoutDetail | null> {
  const workout = await db.getFirstAsync<{
    id: string;
    title: string;
    start_time: number;
    end_time: number | null;
  }>('SELECT id, title, start_time, end_time FROM workouts WHERE id = ?', [workoutId]);
  if (!workout) return null;

  const rows = await db.getAllAsync<{
    we_id: string;
    exercise_id: string;
    exercise_name: string;
    equipment_id: string;
    order_index: number;
    set_id: string | null;
    set_order: number | null;
    weight_kg: number | null;
    reps: number | null;
    is_personal_record: number | null;
  }>(
    `SELECT we.id as we_id, we.exercise_id, ex.name as exercise_name, ex.equipment_id, we.order_index,
            ws.id as set_id, ws.set_order, ws.weight_kg, ws.reps, ws.is_personal_record
     FROM workout_exercises we
     JOIN exercises ex ON ex.id = we.exercise_id
     LEFT JOIN workout_sets ws ON ws.workout_exercise_id = we.id AND ws.is_completed = 1
     WHERE we.workout_id = ?
     ORDER BY we.order_index ASC, ws.set_order ASC`,
    [workoutId]
  );

  const exerciseById = new Map<string, WorkoutDetail['exercises'][number]>();
  let setCount = 0;
  let volumeKg = 0;
  let topSetWeightKg: number | null = null;
  let prCount = 0;

  for (const row of rows) {
    let exercise = exerciseById.get(row.we_id);
    if (!exercise) {
      exercise = {
        id: row.we_id,
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name,
        equipmentId: row.equipment_id,
        sets: [],
      };
      exerciseById.set(row.we_id, exercise);
    }
    if (row.set_id !== null) {
      const isPr = row.is_personal_record === 1;
      exercise.sets.push({
        id: row.set_id,
        setOrder: row.set_order ?? 0,
        weightKg: row.weight_kg,
        reps: row.reps,
        isPersonalRecord: isPr,
      });
      setCount += 1;
      if (row.weight_kg !== null && row.reps !== null) {
        volumeKg += row.weight_kg * row.reps;
        if (topSetWeightKg === null || row.weight_kg > topSetWeightKg) topSetWeightKg = row.weight_kg;
      }
      if (isPr) prCount += 1;
    }
  }

  return {
    id: workout.id,
    title: workout.title,
    startTime: workout.start_time,
    endTime: workout.end_time,
    durationMinutes: toMinutes(workout.start_time, workout.end_time),
    exercises: [...exerciseById.values()],
    setCount,
    volumeKg,
    topSetWeightKg,
    prCount,
  };
}

export async function getMonthStats(db: SQLiteDatabase, monthStart: number, monthEnd: number): Promise<MonthStats> {
  const row = await db.getFirstAsync<{ session_count: number; set_count: number; volume_kg: number }>(
    `SELECT COUNT(DISTINCT w.id) as session_count,
            COUNT(ws.id) as set_count,
            COALESCE(SUM(ws.weight_kg * ws.reps), 0) as volume_kg
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id = w.id
     JOIN workout_sets ws ON ws.workout_exercise_id = we.id AND ws.is_completed = 1
     WHERE w.end_time IS NOT NULL AND w.start_time >= ? AND w.start_time < ?`,
    [monthStart, monthEnd]
  );
  return {
    sessionCount: row?.session_count ?? 0,
    setCount: row?.set_count ?? 0,
    volumeKg: row?.volume_kg ?? 0,
  };
}

/** Local day-of-month numbers (1-31) with at least one finished workout, for calendar highlighting. */
export async function getTrainedDaysInMonth(
  db: SQLiteDatabase,
  monthStart: number,
  monthEnd: number
): Promise<Set<number>> {
  const rows = await db.getAllAsync<{ start_time: number }>(
    'SELECT DISTINCT start_time FROM workouts WHERE end_time IS NOT NULL AND start_time >= ? AND start_time < ?',
    [monthStart, monthEnd]
  );
  return new Set(rows.map((row) => new Date(row.start_time).getDate()));
}

export async function getWeeklyVolumeSeries(db: SQLiteDatabase, weeks: number): Promise<WeeklyVolumePoint[]> {
  const earliestWeekStart = addWeeks(startOfWeek(Date.now()), -(weeks - 1));

  const rows = await db.getAllAsync<{ completed_at: number; weight_kg: number | null; reps: number | null }>(
    `SELECT ws.completed_at, ws.weight_kg, ws.reps
     FROM workout_sets ws
     WHERE ws.is_completed = 1 AND ws.completed_at >= ?`,
    [earliestWeekStart]
  );

  const buckets = new Map<number, number>();
  for (let i = 0; i < weeks; i++) buckets.set(addWeeks(earliestWeekStart, i), 0);

  for (const row of rows) {
    if (row.weight_kg === null || row.reps === null) continue;
    const weekStart = startOfWeek(row.completed_at);
    buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + row.weight_kg * row.reps);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekStart, volumeKg]) => ({ weekStart, volumeKg }));
}

/** Consecutive Monday-anchored weeks with >=1 finished workout, counted back from the current week. */
export async function getStreakWeeks(db: SQLiteDatabase): Promise<number> {
  const rows = await db.getAllAsync<{ start_time: number }>(
    'SELECT start_time FROM workouts WHERE end_time IS NOT NULL'
  );
  if (rows.length === 0) return 0;

  const trainedWeeks = new Set(rows.map((row) => startOfWeek(row.start_time)));
  const currentWeek = startOfWeek(Date.now());

  // If the current week has no session yet, start counting from last week so
  // a streak isn't zeroed out mid-week before the user has had a chance to train.
  let cursor = trainedWeeks.has(currentWeek) ? currentWeek : addWeeks(currentWeek, -1);

  let streak = 0;
  while (trainedWeeks.has(cursor)) {
    streak += 1;
    cursor = addWeeks(cursor, -1);
  }
  return streak;
}
