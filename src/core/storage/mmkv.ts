import { createMMKV } from 'react-native-mmkv';

/**
 * Single shared MMKV instance for preferences, unit settings, and the
 * crash-recovery active-workout snapshot (see activeWorkoutStore.ts).
 */
export const storage = createMMKV({ id: 'fitness-tracker-storage' });
