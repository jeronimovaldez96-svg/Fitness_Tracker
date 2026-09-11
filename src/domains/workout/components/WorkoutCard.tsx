import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  function handleComplete(setId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCompleteSet(exercise.id, setId);
  }

  return (
    <View style={[styles.card, { borderBottomColor: colors.divider }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink }]}>{exercise.exerciseName}</Text>
          <View style={styles.metaRow}>
            <Tag variant="neutral" label={exercise.equipmentId.replace(/-/g, ' ')} />
            {exercise.lastLabel ? (
              <Text style={[styles.lastLabel, { color: colors.muted }]}>{exercise.lastLabel}</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => onReplaceExercise(exercise.id)}
          accessibilityRole="button"
          accessibilityLabel="Exercise options"
          style={styles.optionsButton}
        >
          <Text style={[styles.optionsLabel, { color: colors.muted }]}>⋯</Text>
        </Pressable>
      </View>

      <View style={[styles.columnHeader, { borderBottomColor: colors.soft }]}>
        <Text style={[styles.columnLabel, styles.columnSet, { color: colors.ghost }]}>SET</Text>
        <Text style={[styles.columnLabel, styles.columnFlex, { color: colors.ghost }]}>KG</Text>
        <Text style={[styles.columnLabel, styles.columnFlex, { color: colors.ghost }]}>REPS</Text>
        <Text style={[styles.columnLabel, styles.columnDone, { color: colors.ghost }]}>DONE</Text>
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

      <Button label="+ Add set" variant="ghost" onPress={() => onAddSet(exercise.id)} style={styles.addSetButton} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    card: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 2,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: theme.spacing.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl + 4,
      letterSpacing: -0.3,
    },
    metaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      marginTop: 7,
    },
    lastLabel: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
    },
    optionsButton: {
      width: theme.minTouchTarget,
      height: theme.minTouchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    optionsLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
    },
    columnHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      paddingBottom: 6,
      borderBottomWidth: 1,
    },
    columnLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    columnSet: {
      width: 22,
    },
    columnFlex: {
      flex: 1,
    },
    columnDone: {
      width: theme.minTouchTarget,
      textAlign: 'center' as const,
    },
    addSetButton: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 0,
      marginTop: 4,
    },
  };
}
