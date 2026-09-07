import type { SQLiteDatabase } from 'expo-sqlite';

export async function insertWorkoutRecord(
  db: SQLiteDatabase,
  params: { id: string; title: string; startTime: number }
): Promise<void> {
  await db.runAsync(
    'INSERT INTO workouts (id, title, start_time) VALUES (?, ?, ?)',
    params.id,
    params.title,
    params.startTime
  );
}

export async function finishWorkoutRecord(
  db: SQLiteDatabase,
  params: { id: string; endTime: number }
): Promise<void> {
  await db.runAsync('UPDATE workouts SET end_time = ? WHERE id = ?', params.endTime, params.id);
}
