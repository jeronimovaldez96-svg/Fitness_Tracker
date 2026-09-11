import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDatabaseIfEmpty, seedRoutinesIfEmpty } from '../seed';
import { up as up001 } from './001_initial_schema';
import { up as up002 } from './002_plans_and_progress';

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const MIGRATIONS: Migration[] = [
  { version: 1, up: up001 },
  { version: 2, up: up002 },
];

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // foreign_keys is a per-connection PRAGMA (not persisted in the db file), so it must
  // be set on every connection open, not just once during the initial schema migration.
  await db.execAsync('PRAGMA foreign_keys = ON');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;
    await migration.up(db);
    currentVersion = migration.version;
    await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
  }

  // Phase 1 ships with no separate content-authoring pipeline, so this
  // baseline exercise catalog is the app's real starter content, not a
  // dev-only fixture — it must run in every build, not just __DEV__.
  await seedDatabaseIfEmpty(db);
  await seedRoutinesIfEmpty(db);
}
