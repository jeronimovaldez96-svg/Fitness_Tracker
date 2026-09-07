import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/core/theme';
import { DATABASE_NAME } from '@/core/database/client';
import { migrateDbIfNeeded } from '@/core/database/migrations';
import {
  ensureRestTimerChannel,
  requestNotificationPermission,
} from '@/core/notifications/restTimerNotifications';

export default function RootLayout() {
  useEffect(() => {
    void ensureRestTimerChannel();
    void requestNotificationPermission();
  }, []);

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="exercise-picker" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="active-session"
          options={{ presentation: 'fullScreenModal', title: 'Active Workout' }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
