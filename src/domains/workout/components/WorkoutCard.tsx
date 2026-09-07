import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, spacing } from '@/core/theme';
import { Button } from '@/shared/components/Button';

import type { ActiveWorkoutExercise, FocusedField } from '../types/workout.types';
import { SetRow } from './SetRow';

type WorkoutCardProps = {
  exercise: ActiveWorkoutExercise;
  focusedField: FocusedField | null;
  onFocusField: (setId: string, field: 'weight' | 'reps') => void;
  onCompleteSet: (workoutExerciseId: string, setId: string) => void;
  onAddSet: (workoutExerciseId: string) => void;
  onReplaceExercise: (workoutExerciseId: string) => void;
};

export function WorkoutCard({
  exercise,
  focusedField,
  onFocusField,
  onCompleteSet,
  onAddSet,
  onReplaceExercise,
}: WorkoutCardProps) {
  function handleComplete(setId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCompleteSet(exercise.id, setId);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.exerciseName}</Text>
        <Pressable
          onPress={() => onReplaceExercise(exercise.id)}
          accessibilityRole="button"
          accessibilityLabel="Exercise options"
          style={styles.optionsButton}
        >
          <Text style={styles.optionsLabel}>⋯</Text>
        </Pressable>
      </View>

      {exercise.sets.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          focusedField={focusedField}
          onFocusField={onFocusField}
          onComplete={handleComplete}
        />
      ))}

      <Button label="+ Add Set" variant="ghost" onPress={() => onAddSet(exercise.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  optionsButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
});
