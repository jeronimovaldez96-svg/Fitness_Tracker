import type { SQLiteDatabase } from 'expo-sqlite';

import { calculateE1RM, MAX_REPS_FOR_ESTIMATE } from '@/shared/utils/oneRepMax';

export type GhostSet = {
  setOrder: number;
  weightKg: number | null;
  reps: number | null;
};

export async function insertWorkoutExercise(
  db: SQLiteDatabase,
  params: { id: string; workoutId: string; exerciseId: string; orderIndex: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
    params.id,
    params.workoutId,
    params.exerciseId,
    params.orderIndex
  );
}

export async function insertBlankSet(
  db: SQLiteDatabase,
  params: { id: string; workoutExerciseId: string; setOrder: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO workout_sets (id, workout_exercise_id, set_order) VALUES (?, ?, ?)',
    params.id,
    params.workoutExerciseId,
    params.setOrder
  );
}

export async function completeWorkoutSet(
  db: SQLiteDatabase,
  params: {
    id: string;
    weightKg: number | null;
    reps: number | null;
    completedAt: number;
    isPersonalRecord: boolean;
  }
): Promise<void> {
  await db.runAsync(
    'UPDATE workout_sets SET weight_kg = ?, reps = ?, is_completed = 1, completed_at = ?, is_personal_record = ? WHERE id = ?',
    params.weightKg,
    params.reps,
    params.completedAt,
    params.isPersonalRecord ? 1 : 0,
    params.id
  );
}

export async function updateWorkoutExerciseId(
  db: SQLiteDatabase,
  params: { workoutExerciseId: string; exerciseId: string }
): Promise<void> {
  await db.runAsync(
    'UPDATE workout_exercises SET exercise_id = ? WHERE id = ?',
    params.exerciseId,
    params.workoutExerciseId
  );
}

export async function resetWorkoutSets(db: SQLiteDatabase, workoutExerciseId: string): Promise<void> {
  await db.runAsync(
    'UPDATE workout_sets SET weight_kg = NULL, reps = NULL, is_completed = 0, completed_at = NULL WHERE workout_exercise_id = ?',
    workoutExerciseId
  );
}

/**
 * TRD 7.3: the historical best e1RM ever recorded for this exercise, across
 * all workouts including the in-progress one, so a PR can be beaten within
 * the same session. Excludes the set being compared.
 *
 * Computed in JS (rather than inline SQL) via the shared `calculateE1RM` so
 * the piecewise Brzycki/Epley formula can't drift out of sync between the
 * candidate-set check and this historical lookup.
 */
export async function getHistoricalMaxE1RM(
  db: SQLiteDatabase,
  exerciseId: string,
  excludeSetId: string
): Promise<number | null> {
  const rows = await db.getAllAsync<{ weight_kg: number; reps: number }>(
    `SELECT ws.weight_kg, ws.reps
     FROM workout_sets ws
     JOIN workout_exercises we ON we.id = ws.workout_exercise_id
     WHERE we.exercise_id = ? AND ws.is_completed = 1 AND ws.reps > 0 AND ws.reps <= ?
       AND ws.weight_kg IS NOT NULL AND ws.id != ?`,
    [exerciseId, MAX_REPS_FOR_ESTIMATE, excludeSetId]
  );

  let maxE1rm: number | null = null;
  for (const row of rows) {
    const e1rm = calculateE1RM(row.weight_kg, row.reps);
    if (e1rm !== null && (maxE1rm === null || e1rm > maxE1rm)) maxE1rm = e1rm;
  }
  return maxE1rm;
}

/**
 * TRD 5.1 Ghost Value Engine: finds the sets from the most recent *completed*
 * workout that featured this exercise (excluding the in-progress workout).
 */
export async function getGhostSetsForExercise(
  db: SQLiteDatabase,
  exerciseId: string,
  excludeWorkoutId: string
): Promise<GhostSet[]> {
  const mostRecent = await db.getFirstAsync<{ workout_exercise_id: string }>(
    `SELECT we.id as workout_exercise_id
     FROM workout_exercises we
     JOIN workouts w ON w.id = we.workout_id
     WHERE we.exercise_id = ? AND w.end_time IS NOT NULL AND w.id != ?
     ORDER BY w.start_time DESC
     LIMIT 1`,
    [exerciseId, excludeWorkoutId]
  );

  if (!mostRecent) return [];

  const rows = await db.getAllAsync<{
    set_order: number;
    weight_kg: number | null;
    reps: number | null;
  }>(
    'SELECT set_order, weight_kg, reps FROM workout_sets WHERE workout_exercise_id = ? ORDER BY set_order ASC',
    [mostRecent.workout_exercise_id]
  );

  return rows.map((row) => ({ setOrder: row.set_order, weightKg: row.weight_kg, reps: row.reps }));
}
