import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL } from '../schema';

export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
}
