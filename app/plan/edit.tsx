import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createRoutine, getRoutineWithExercises, updateRoutine } from '@/core/database/queries/routines.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import type { ExerciseSummary } from '@/domains/catalog/types/catalog.types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { generateId } from '@/shared/utils/id';
import { setNavigationCallback } from '@/shared/utils/navigationCallback';

type DraftExercise = {
  tempId: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: string;
  targetReps: string;
  targetWeightKg: string;
};

export default function PlanEditRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);

  useEffect(() => {
    if (!id) return;
    getRoutineWithExercises(db, id).then((routine) => {
      if (!routine) return;
      setName(routine.name);
      setExercises(
        routine.exercises.map((ex) => ({
          tempId: generateId(),
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetSets: String(ex.targetSets),
          targetReps: ex.targetReps,
          targetWeightKg: ex.targetWeightKg !== null ? String(ex.targetWeightKg) : '',
        }))
      );
    });
  }, [db, id]);

  function handleAddExercise() {
    setNavigationCallback<ExerciseSummary>((exercise) => {
      setExercises((prev) => [
        ...prev,
        {
          tempId: generateId(),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          targetSets: '3',
          targetReps: '8',
          targetWeightKg: '',
        },
      ]);
    });
    router.push('/exercise-picker');
  }

  function updateRow(tempId: string, patch: Partial<DraftExercise>) {
    setExercises((prev) => prev.map((ex) => (ex.tempId === tempId ? { ...ex, ...patch } : ex)));
  }

  function removeRow(tempId: string) {
    setExercises((prev) => prev.filter((ex) => ex.tempId !== tempId));
  }

  async function handleSave() {
    if (name.trim() === '' || exercises.length === 0) return;

    const input = exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      targetSets: Math.max(1, parseInt(ex.targetSets, 10) || 1),
      targetReps: ex.targetReps.trim() || '8',
      targetWeightKg: ex.targetWeightKg.trim() === '' ? null : parseFloat(ex.targetWeightKg),
    }));

    if (isEditing) {
      await updateRoutine(db, id, { name: name.trim(), exercises: input });
      router.replace(`/plan/${id}`);
    } else {
      const newId = await createRoutine(db, { name: name.trim(), cycleLabel: null, dayLabel: null, exercises: input });
      router.replace(`/plan/${newId}`);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button label="Cancel" onPress={() => router.back()} variant="ghost" compact style={styles.cancelButton} />
        <Text style={[styles.title, { color: colors.ink }]}>{isEditing ? 'Edit plan' : 'New plan'}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        <Input label="Plan name" value={name} onChangeText={setName} placeholder="Push A" />

        <View style={styles.exerciseList}>
          {exercises.map((exercise, index) => (
            <View key={exercise.tempId} style={[styles.exerciseRow, { borderBottomColor: colors.soft }]}>
              <View style={styles.exerciseRowHeader}>
                <Text style={[styles.exerciseIndex, { color: colors.ghost }]}>{index + 1}</Text>
                <Text style={[styles.exerciseName, { color: colors.ink }]}>{exercise.exerciseName}</Text>
                <Pressable onPress={() => removeRow(exercise.tempId)} accessibilityRole="button" accessibilityLabel="Remove exercise">
                  <Text style={[styles.removeLabel, { color: colors.accent }]}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.exerciseInputsRow}>
                <Input
                  label="Sets"
                  value={exercise.targetSets}
                  onChangeText={(v) => updateRow(exercise.tempId, { targetSets: v })}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
                <Input
                  label="Reps"
                  value={exercise.targetReps}
                  onChangeText={(v) => updateRow(exercise.tempId, { targetReps: v })}
                  style={styles.smallInput}
                />
                <Input
                  label="Weight (kg)"
                  value={exercise.targetWeightKg}
                  onChangeText={(v) => updateRow(exercise.tempId, { targetWeightKg: v })}
                  keyboardType="decimal-pad"
                  style={styles.smallInput}
                />
              </View>
            </View>
          ))}
        </View>

        <Button label="+ Add exercise" onPress={handleAddExercise} variant="secondary" fullWidth style={styles.addButton} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + 14 }]}>
        <Button label="Save plan" onPress={handleSave} variant="primary" fullWidth showArrow />
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
    },
    cancelButton: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 0,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1,
      letterSpacing: -0.4,
      marginTop: 6,
    },
    divider: {
      height: 2,
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    exerciseList: {
      gap: 0,
    },
    exerciseRow: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      gap: theme.spacing.sm,
    },
    exerciseRowHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
    },
    exerciseIndex: {
      width: 20,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
    },
    exerciseName: {
      flex: 1,
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    removeLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.sm,
    },
    exerciseInputsRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    smallInput: {
      flex: 1,
    },
    addButton: {
      marginTop: theme.spacing.sm,
    },
    footer: {
      borderTopWidth: 2,
      padding: theme.spacing.lg,
    },
  };
}
