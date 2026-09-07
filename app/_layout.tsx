import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { DATABASE_NAME } from '@/core/database/client';
import { migrateDbIfNeeded } from '@/core/database/migrations';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack />
    </SQLiteProvider>
  );
}
