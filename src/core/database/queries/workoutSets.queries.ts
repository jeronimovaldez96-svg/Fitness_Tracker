import type { SQLiteDatabase } from 'expo-sqlite';

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
  params: { id: string; weightKg: number | null; reps: number | null; completedAt: number }
): Promise<void> {
  await db.runAsync(
    'UPDATE workout_sets SET weight_kg = ?, reps = ?, is_completed = 1, completed_at = ? WHERE id = ?',
    params.weightKg,
    params.reps,
    params.completedAt,
    params.id
  );
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
