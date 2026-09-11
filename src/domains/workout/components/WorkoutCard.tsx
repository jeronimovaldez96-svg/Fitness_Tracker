import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { getEquipmentFamily } from '@/domains/catalog/utils/formGuide';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { Button } from '@/shared/components/Button';
import { FormGuideIllustration } from '@/shared/components/FormGuideIllustration';
import { Modal } from '@/shared/components/Modal';
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
  const [isFormGuideVisible, setIsFormGuideVisible] = useState(false);

  function handleComplete(setId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCompleteSet(exercise.id, setId);
  }

  return (
    <View style={[styles.card, { borderBottomColor: colors.divider }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setIsFormGuideVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`View form guide for ${exercise.exerciseName}`}
          hitSlop={8}
          style={[styles.thumbnail, { borderColor: colors.divider }]}
        >
          <FormGuideIllustration equipmentFamily={getEquipmentFamily(exercise.equipmentId)} color={colors.muted} size={32} />
        </Pressable>
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

      <Modal visible={isFormGuideVisible} onRequestClose={() => setIsFormGuideVisible(false)}>
        <View style={styles.formGuideIllustrationWrap}>
          <FormGuideIllustration equipmentFamily={getEquipmentFamily(exercise.equipmentId)} color={colors.ink} size={160} />
        </View>
        <Text style={[styles.formGuideTitle, { color: colors.ink }]}>{exercise.exerciseName}</Text>
        <Button
          label="Close"
          onPress={() => setIsFormGuideVisible(false)}
          variant="secondary"
          fullWidth
          style={styles.formGuideCloseButton}
        />
      </Modal>
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
    thumbnail: {
      width: 40,
      height: 40,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    formGuideIllustrationWrap: {
      alignItems: 'center' as const,
      marginBottom: theme.spacing.lg,
    },
    formGuideTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      textAlign: 'center' as const,
    },
    formGuideCloseButton: {
      marginTop: theme.spacing.lg,
    },
  };
}
