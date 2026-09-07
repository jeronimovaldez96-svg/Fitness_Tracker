import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, spacing } from '@/core/theme';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { Button } from '@/shared/components/Button';
import { NumericPad, type NumericPadKey } from '@/shared/components/NumericPad';
import { calculatePlatesPerSide } from '@/shared/utils/plateCalculator';
import { setNavigationCallback } from '@/shared/utils/navigationCallback';

import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { WorkoutCard } from '../components/WorkoutCard';

export function ActiveSessionScreen() {
  const {
    workoutId,
    exercises,
    focusedField,
    startWorkout,
    addExercise,
    focusField,
    clearFocus,
    appendDigit,
    backspace,
    completeSet,
    addSet,
    finishWorkout,
  } = useActiveWorkout();

  const [isPlateCalculatorEnabled, setPlateCalculatorEnabled] = useState(false);

  useEffect(() => {
    if (!workoutId) {
      startWorkout();
    }
    // Starting a workout is a one-time boot action for this screen, not a
    // reactive sync — re-running on every `startWorkout` identity change
    // would fire it repeatedly since the store recreates it each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  function handleAddExercise() {
    setNavigationCallback<ExerciseSummary>((exercise) => {
      addExercise(exercise);
    });
    router.push('/exercise-picker');
  }

  function handleFinishWorkout() {
    finishWorkout();
    router.back();
  }

  function handleKeyPress(key: NumericPadKey) {
    if (key === 'backspace') {
      backspace();
    } else {
      appendDigit(key);
    }
  }

  function handleNextSet() {
    if (!focusedField) return;
    const exercise = exercises.find((ex) => ex.sets.some((s) => s.id === focusedField.setId));
    if (!exercise) return;

    const currentIndex = exercise.sets.findIndex((s) => s.id === focusedField.setId);
    const next = exercise.sets[currentIndex + 1];
    if (next) {
      focusField(next.id, 'weight');
    } else {
      addSet(exercise.id);
    }
  }

  const focusedSet = focusedField
    ? exercises
        .flatMap((ex) => ex.sets)
        .find((s) => s.id === focusedField.setId)
    : null;

  const focusedWeightValue = focusedSet
    ? parseFloat(focusedSet.draftWeight || String(focusedSet.weightKg ?? focusedSet.ghostWeightKg ?? 0))
    : 0;

  const plateSummary =
    isPlateCalculatorEnabled && focusedField?.field === 'weight' && focusedWeightValue > 0
      ? calculatePlatesPerSide(focusedWeightValue, 'metric')
          .plates.map((p) => `${p.count}x${p.size}`)
          .join(' ') || 'Bar only'
      : undefined;

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <WorkoutCard
            exercise={item}
            focusedField={focusedField}
            onFocusField={focusField}
            onCompleteSet={completeSet}
            onAddSet={addSet}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyLabel}>Add an exercise to begin</Text>}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button label="Add Exercise" onPress={handleAddExercise} variant="secondary" />
            <Button label="Finish Workout" onPress={handleFinishWorkout} variant="success" />
          </View>
        }
      />

      {/* Rendered inline (not a Modal) so tapping another field while the pad
          is open switches focus instead of being swallowed by a backdrop. */}
      {focusedField ? (
        <View style={[styles.keypadPanel, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable onPress={clearFocus} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
          <NumericPad
            onKeyPress={handleKeyPress}
            onNextSet={handleNextSet}
            isPlateCalculatorEnabled={isPlateCalculatorEnabled}
            onTogglePlateCalculator={() => setPlateCalculatorEnabled((prev) => !prev)}
            plateSummary={plateSummary}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  keypadPanel: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  doneLabel: {
    alignSelf: 'flex-end',
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    minHeight: MIN_TOUCH_TARGET,
    textAlignVertical: 'center',
    paddingHorizontal: spacing.sm,
  },
});
