import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'fitness_tracker.db';

/**
 * Opens the database outside the React tree (e.g. dev seed scripts).
 * Screens/hooks should prefer `useSQLiteContext()` from the SQLiteProvider instead.
 */
export function openDatabase(): SQLiteDatabase {
  return openDatabaseSync(DATABASE_NAME);
}
