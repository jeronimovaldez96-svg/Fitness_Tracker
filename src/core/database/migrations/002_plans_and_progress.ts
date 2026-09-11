import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Additive schema for the Modernist redesign's net-new screens:
 * - `routines` / `routine_exercises`: simple workout templates ("Plans").
 *   No rotation engine — `last_used_at` alone drives the "NEXT" heuristic
 *   (oldest-used routine, NULLs first) at read time.
 * - `body_measurements`: named circumference measurements (waist/chest/
 *   upper arm/thigh) for the Body screen; the existing `body_metrics` table
 *   (weight_kg, body_fat_percentage) already covers the "Weight" row.
 * - `workout_sets.is_personal_record`: persists the PR flag
 *   `activeWorkoutStore.completeSet` already computes at completion time
 *   (previously discarded after driving the confetti trigger), so History /
 *   Session log / Progress can show it without recomputing after the fact.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE workout_sets ADD COLUMN is_personal_record INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cycle_label TEXT,
      day_label TEXT,
      order_index INTEGER NOT NULL,
      last_used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (UNIXEPOCH())
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      target_sets INTEGER NOT NULL,
      target_reps TEXT NOT NULL,
      target_weight_kg REAL,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      measured_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_routine_exercises_order ON routine_exercises(routine_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_body_measurements_metric ON body_measurements(metric, measured_at DESC);
  `);
}
