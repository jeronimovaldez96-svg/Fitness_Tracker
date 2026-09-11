import type { SQLiteDatabase } from 'expo-sqlite';

import { seedRoutinesIfEmpty } from '../seed';

export type ExportRow = {
  workout_title: string;
  start_time: number;
  end_time: number | null;
  exercise_name: string;
  set_order: number;
  weight_kg: number | null;
  reps: number | null;
  is_personal_record: number;
};

export async function getAllSetsForExport(db: SQLiteDatabase): Promise<ExportRow[]> {
  return db.getAllAsync<ExportRow>(`
    SELECT w.title as workout_title, w.start_time, w.end_time,
           ex.name as exercise_name, ws.set_order, ws.weight_kg, ws.reps, ws.is_personal_record
    FROM workout_sets ws
    JOIN workout_exercises we ON we.id = ws.workout_exercise_id
    JOIN workouts w ON w.id = we.workout_id
    JOIN exercises ex ON ex.id = we.exercise_id
    WHERE ws.is_completed = 1
    ORDER BY w.start_time ASC, we.order_index ASC, ws.set_order ASC
  `);
}

/**
 * Wipes user-generated training/body data (workouts, routines, body metrics)
 * but leaves the exercise catalog untouched — that's app content, not user
 * data. Re-seeds the starter routines afterward, matching a fresh install.
 */
export async function resetUserData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM workouts;
      DELETE FROM routines;
      DELETE FROM body_metrics;
      DELETE FROM body_measurements;
      DELETE FROM nutrition_daily_logs;
    `);
  });
  await seedRoutinesIfEmpty(db);
}
