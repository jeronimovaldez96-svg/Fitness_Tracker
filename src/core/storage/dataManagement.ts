import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_NAME } from '@/core/database/client';
import { getAllSetsForExport, resetUserData } from '@/core/database/queries/dataManagement.queries';

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV of every completed set, writes it to a cache file, and opens the native share sheet. */
export async function exportWorkoutsAsCsv(db: SQLiteDatabase): Promise<void> {
  const rows = await getAllSetsForExport(db);

  const header = ['Date', 'Workout', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'PR'];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        csvEscape(new Date(row.start_time).toISOString()),
        csvEscape(row.workout_title),
        csvEscape(row.exercise_name),
        csvEscape(row.set_order),
        csvEscape(row.weight_kg ?? ''),
        csvEscape(row.reps ?? ''),
        csvEscape(row.is_personal_record ? 'Yes' : ''),
      ].join(',')
    );
  }

  const file = new File(Paths.cache, `fitness-tracker-export-${Date.now()}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(lines.join('\n'));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export workouts' });
  }
}

/** Copies the live SQLite database file into a timestamped backup under the document directory. */
export async function backupDatabase(): Promise<void> {
  const sourceFile = new File(Paths.document, 'SQLite', DATABASE_NAME);
  if (!sourceFile.exists) throw new Error('Database file not found');

  const backupsDir = new Directory(Paths.document, 'backups');
  if (!backupsDir.exists) backupsDir.create({ intermediates: true });

  const destination = new File(backupsDir, `fitness_tracker-${Date.now()}.db`);
  await sourceFile.copy(destination, { overwrite: true });
}

export async function resetAllData(db: SQLiteDatabase): Promise<void> {
  await resetUserData(db);
}
