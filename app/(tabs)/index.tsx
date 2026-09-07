import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/core/theme';
import { useActiveWorkoutStore } from '@/domains/workout/store/activeWorkoutStore';
import { Button } from '@/shared/components/Button';

// Module-level (not React state): survives re-renders and tab switches for
// the lifetime of the JS process, but resets on a true cold start — exactly
// the "did we already check for a crashed session this launch?" flag we want.
let hasCheckedBootResume = false;

export default function HomeScreen() {
  const workoutId = useActiveWorkoutStore((state) => state.workoutId);

  useEffect(() => {
    if (!hasCheckedBootResume) {
      hasCheckedBootResume = true;
      if (workoutId) {
        // push (not replace) so Home stays underneath in the back stack,
        // consistent with the manual "Resume Workout" button below.
        router.push('/active-session');
      }
    }
    // Only ever act on the boot-time value, once — not on every workoutId
    // change while the app keeps running (e.g. finishing a workout later, or
    // navigating back to Home mid-session, shouldn't bounce the user back in).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness_Tracker</Text>
      <Button
        label={workoutId ? 'Resume Workout' : 'Start Workout'}
        onPress={() => router.push('/active-session')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.lg,
    color: colors.text,
  },
});
