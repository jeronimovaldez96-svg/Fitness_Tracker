import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DevSettings } from 'react-native';

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

/**
 * Dev/test-only: lets the developer pick a previously-created `.db` backup
 * (see `backupDatabase`) and fully replaces the live database file with it.
 * Closes the current connection first so the file isn't overwritten while
 * open, then reloads the JS bundle so a fresh `SQLiteProvider` connection
 * picks up the restored file. Returns false if the user cancelled the picker.
 */
export async function restoreDatabase(db: SQLiteDatabase): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return false;

  const pickedFile = new File(result.assets[0].uri);
  await db.closeAsync();

  const destination = new File(Paths.document, 'SQLite', DATABASE_NAME);
  await pickedFile.copy(destination, { overwrite: true });

  DevSettings.reload('Database restored from backup');
  return true;
}
