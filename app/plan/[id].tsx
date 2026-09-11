import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRoutineWithExercises } from '@/core/database/queries/routines.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { useActiveWorkoutStore } from '@/domains/workout/store/activeWorkoutStore';
import type { RoutineDetail } from '@/domains/workout/types/routine.types';
import { formatWeekdayDate } from '@/shared/utils/formatDate';
import { Button } from '@/shared/components/Button';

export default function PlanDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const startWorkoutFromRoutine = useActiveWorkoutStore((state) => state.startWorkoutFromRoutine);
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getRoutineWithExercises(db, id).then((result) => {
        if (!cancelled) setRoutine(result);
      });
      return () => {
        cancelled = true;
      };
    }, [db, id])
  );

  async function handleStart() {
    await startWorkoutFromRoutine(db, id);
    router.push('/active-session');
  }

  if (!routine) {
    return <View style={[styles.container, { backgroundColor: colors.bg }]} />;
  }

  const totalMinutes = routine.exercises.reduce((sum, ex) => sum + ex.targetSets * 3, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button label="← PLANS" onPress={() => router.back()} variant="ghost" compact style={styles.backButton} />
        {routine.cycleLabel ? (
          <Text style={[styles.kicker, { color: colors.muted }]}>
            {routine.cycleLabel}
            {routine.dayLabel ? ` · ${routine.dayLabel}` : ''}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.ink }]}>{routine.name}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {routine.exercises.length} exercises · ~{totalMinutes} min
          {routine.lastUsedAt ? ` · last ${formatWeekdayDate(routine.lastUsedAt)}` : ''}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView style={styles.list}>
        <View style={[styles.columnHeader, { borderBottomColor: colors.soft }]}>
          <Text style={[styles.columnLabel, styles.columnIndex, { color: colors.ghost }]}>#</Text>
          <Text style={[styles.columnLabel, styles.columnFlex, { color: colors.ghost }]}>EXERCISE</Text>
          <Text style={[styles.columnLabel, styles.columnSets, { color: colors.ghost }]}>SETS</Text>
          <Text style={[styles.columnLabel, styles.columnTarget, { color: colors.ghost }]}>TARGET</Text>
        </View>
        {routine.exercises.map((exercise, index) => (
          <View key={exercise.id} style={[styles.row, { borderBottomColor: colors.soft }]}>
            <Text style={[styles.rowIndex, styles.columnIndex, { color: colors.ghost }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View style={styles.columnFlex}>
              <Text style={[styles.rowName, { color: colors.ink }]}>{exercise.exerciseName}</Text>
              <View style={[styles.equipmentTag, { backgroundColor: colors.surface2 }]}>
                <Text style={[styles.equipmentTagText, { color: colors.muted }]}>
                  {exercise.equipmentName.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.rowScheme, styles.columnSets, { color: colors.muted }]}>
              {exercise.targetSets} × {exercise.targetReps}
            </Text>
            <Text style={[styles.rowTarget, styles.columnTarget, { color: colors.ink }]}>
              {exercise.targetWeightKg ? `${exercise.targetWeightKg} kg` : '—'}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + 14 }]}>
        <Button label="Start workout" onPress={handleStart} variant="primary" showArrow style={styles.startButton} />
        <Button label="EDIT" onPress={() => router.push({ pathname: '/plan/edit', params: { id: routine.id } })} variant="secondary" compact />
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
    backButton: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 0,
    },
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
      marginTop: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display2,
      letterSpacing: -0.4,
      marginTop: 8,
    },
    meta: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      marginTop: 9,
    },
    divider: {
      height: 2,
    },
    list: {
      flex: 1,
    },
    columnHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      paddingVertical: 8,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    columnLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    columnIndex: {
      width: 20,
    },
    columnFlex: {
      flex: 1,
    },
    columnSets: {
      width: 52,
    },
    columnTarget: {
      width: 62,
      textAlign: 'right' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    rowIndex: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    rowName: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    equipmentTag: {
      alignSelf: 'flex-start' as const,
      marginTop: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    equipmentTagText: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 9,
      letterSpacing: 0.5,
    },
    rowScheme: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    rowTarget: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    footer: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
      borderTopWidth: 2,
      padding: theme.spacing.lg,
    },
    startButton: {
      flex: 1,
    },
  };
}
