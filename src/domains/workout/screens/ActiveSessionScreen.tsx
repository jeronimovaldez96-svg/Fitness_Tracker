import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getExerciseById } from '@/core/database/queries/exercises.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { Button } from '@/shared/components/Button';
import { Confetti } from '@/shared/components/Confetti';
import { Modal } from '@/shared/components/Modal';
import { NumericPad, type NumericPadKey } from '@/shared/components/NumericPad';
import { calculatePlatesPerSide } from '@/shared/utils/plateCalculator';
import { setNavigationCallback } from '@/shared/utils/navigationCallback';

import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { RestTimerBanner } from '../components/RestTimerBanner';
import { WorkoutCard } from '../components/WorkoutCard';

type PendingReplacement = {
  workoutExerciseId: string;
  newExercise: ExerciseSummary;
};

function useElapsedLabel(startTime: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startTime === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (startTime === null) return '0:00';
  const totalSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ActiveSessionScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const {
    workoutId,
    title,
    startTime,
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
    replaceExercise,
    finishWorkout,
    lastPersonalRecordSetId,
  } = useActiveWorkout();

  const [isPlateCalculatorEnabled, setPlateCalculatorEnabled] = useState(false);
  const [pendingReplacement, setPendingReplacement] = useState<PendingReplacement | null>(null);
  const elapsed = useElapsedLabel(startTime);

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

  async function handleFinishWorkout() {
    const finishedWorkoutId = await finishWorkout();
    router.back();
    if (finishedWorkoutId) {
      router.push({ pathname: '/session/[id]', params: { id: finishedWorkoutId, summary: '1' } });
    }
  }

  async function handleReplaceExercise(workoutExerciseId: string) {
    const exercise = exercises.find((ex) => ex.id === workoutExerciseId);
    if (!exercise) return;
    const current = await getExerciseById(db, exercise.exerciseId);

    setNavigationCallback<ExerciseSummary>((newExercise) => {
      setPendingReplacement({ workoutExerciseId, newExercise });
    });
    router.push({
      pathname: '/exercise-picker',
      params: current ? { muscleId: current.primaryMuscleId } : {},
    });
  }

  function handleReconcile(mode: 'transfer' | 'reset') {
    if (!pendingReplacement) return;
    replaceExercise(pendingReplacement.workoutExerciseId, pendingReplacement.newExercise, mode);
    setPendingReplacement(null);
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
    ? exercises.flatMap((ex) => ex.sets).find((s) => s.id === focusedField.setId)
    : null;

  const focusedWeightValue = focusedSet
    ? parseFloat(focusedSet.draftWeight || String(focusedSet.weightKg ?? focusedSet.ghostWeightKg ?? 0))
    : 0;

  const plateSummary =
    isPlateCalculatorEnabled && focusedField?.field === 'weight' && focusedWeightValue > 0
      ? calculatePlatesPerSide(focusedWeightValue, 'metric')
          .plates.map((p) => `${p.count}×${p.size}`)
          .join('  ') || 'Bar only'
      : undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.kicker, { color: colors.accent }]}>IN SESSION</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{title || 'Workout'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.elapsed, { color: colors.muted }]}>{elapsed}</Text>
          <Button label="FINISH" onPress={handleFinishWorkout} variant="secondary" compact />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <FlatList
        style={styles.list}
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard
            exercise={item}
            focusedField={focusedField}
            onFocusField={focusField}
            onCompleteSet={completeSet}
            onAddSet={addSet}
            onReplaceExercise={handleReplaceExercise}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyLabel, { color: colors.muted }]}>Add an exercise to begin</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              label="+ Add exercise"
              onPress={handleAddExercise}
              variant="secondary"
              fullWidth
              style={styles.addExerciseButton}
            />
          </View>
        }
      />

      <RestTimerBanner />

      {/* Rendered inline (not a Modal) so tapping another field while the pad
          is open switches focus instead of being swallowed by a backdrop. */}
      {focusedField ? (
        <View style={[styles.keypadPanel, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
          <View style={styles.keypadTopRow}>
            <Button
              label={isPlateCalculatorEnabled && plateSummary ? plateSummary : 'Plate calculator'}
              onPress={() => setPlateCalculatorEnabled((prev) => !prev)}
              variant="secondary"
              compact
              style={styles.plateButton}
            />
            <Button label="Done" onPress={clearFocus} variant="ghost" compact />
          </View>
          <NumericPad onKeyPress={handleKeyPress} onNextSet={handleNextSet} />
        </View>
      ) : null}

      <Modal visible={pendingReplacement !== null} onRequestClose={() => setPendingReplacement(null)}>
        <Text style={[styles.reconcileTitle, { color: colors.ink }]}>
          Replace with {pendingReplacement?.newExercise.name}?
        </Text>
        <Text style={[styles.reconcileBody, { color: colors.muted }]}>
          Keep the logged weights and reps on existing sets, or reset them for the new exercise.
        </Text>
        <Button
          label="Keep logged values"
          onPress={() => handleReconcile('transfer')}
          fullWidth
          style={styles.reconcileButton}
        />
        <Button
          label="Reset values"
          variant="secondary"
          onPress={() => handleReconcile('reset')}
          fullWidth
          style={styles.reconcileButton}
        />
      </Modal>

      <Confetti trigger={lastPersonalRecordSetId} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between' as const,
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    headerLeft: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display2 - 6,
      letterSpacing: -0.4,
      marginTop: 8,
    },
    headerRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
    },
    elapsed: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
      fontVariant: ['tabular-nums' as const],
    },
    divider: {
      height: 2,
    },
    list: {
      flex: 1,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    addExerciseButton: {},
    emptyLabel: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.lg,
      textAlign: 'center' as const,
      marginTop: theme.spacing.xl,
    },
    keypadPanel: {
      // colors applied inline; borderTopWidth handled by NumericPad's own container
    },
    keypadTopRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
    },
    plateButton: {
      flex: 1,
    },
    reconcileTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      marginBottom: theme.spacing.sm,
    },
    reconcileBody: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.md,
      marginBottom: theme.spacing.lg,
    },
    reconcileButton: {
      marginBottom: theme.spacing.sm,
    },
  };
}
