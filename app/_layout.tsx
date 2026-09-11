import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME } from '@/core/database/client';
import { migrateDbIfNeeded } from '@/core/database/migrations';
import {
  ensureRestTimerChannel,
  requestNotificationPermission,
} from '@/core/notifications/restTimerNotifications';
import { ThemeProvider, useTheme } from '@/core/theme';

function ThemedStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.bg },
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.ink,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exercise-picker" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="active-session"
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
        <Stack.Screen name="rest" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="nutrition" options={{ headerShown: false }} />
        <Stack.Screen name="plans" options={{ headerShown: false }} />
        <Stack.Screen name="plan/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="plan/edit" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="body-metrics" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_800ExtraBold,
  });

  useEffect(() => {
    void ensureRestTimerChannel();
    void requestNotificationPermission();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
