import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getWorkoutDetail } from '@/core/database/queries/history.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { useActiveWorkoutStore } from '@/domains/workout/store/activeWorkoutStore';
import type { WorkoutDetail } from '@/domains/workout/types/history.types';
import { formatWeekdayDate } from '@/shared/utils/formatDate';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';

export default function SessionRoute() {
  const { id, summary } = useLocalSearchParams<{ id: string; summary?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const startWorkoutFromWorkout = useActiveWorkoutStore((state) => state.startWorkoutFromWorkout);
  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const isSummary = summary === '1';

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getWorkoutDetail(db, id).then((result) => {
        if (!cancelled) setDetail(result);
      });
      return () => {
        cancelled = true;
      };
    }, [db, id])
  );

  async function handleRepeat() {
    await startWorkoutFromWorkout(db, id);
    router.push('/active-session');
  }

  function handleDone() {
    router.dismissAll();
  }

  if (!detail) {
    return <View style={[styles.container, { backgroundColor: colors.bg }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        {isSummary ? (
          <Text style={[styles.kicker, { color: colors.accent }]}>
            SESSION COMPLETE{detail.prCount > 0 ? ` · ${detail.prCount} NEW PR${detail.prCount === 1 ? '' : 'S'}` : ''}
          </Text>
        ) : (
          <>
            <Button label="← HISTORY" onPress={() => router.back()} variant="ghost" compact style={styles.backButton} />
            <Text style={[styles.kicker, { color: colors.muted }]}>
              {formatWeekdayDate(detail.startTime).toUpperCase()} · {detail.durationMinutes} MIN
            </Text>
          </>
        )}
        <Text style={[styles.title, { color: colors.ink }]}>{detail.title}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.statsRow}>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>SETS</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{detail.setCount}</Text>
        </View>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>VOLUME</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>
            {(detail.volumeKg / 1000).toFixed(1)}
            <Text style={[styles.statUnit, { color: colors.muted }]}> t</Text>
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>TOP SET</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{detail.topSetWeightKg ?? '—'}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView style={styles.list}>
        {detail.exercises.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseBlock, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.exerciseName, { color: colors.ink }]}>{exercise.exerciseName}</Text>
            {exercise.sets.map((set) => (
              <View key={set.id} style={[styles.setRow, { borderBottomColor: colors.soft }]}>
                <Text style={[styles.setNumber, { color: colors.ghost }]}>{set.setOrder}</Text>
                <Text style={[styles.setValue, { color: colors.ink }]}>
                  {set.weightKg}
                  <Text style={[styles.setUnit, { color: colors.muted }]}> kg</Text>
                </Text>
                <Text style={[styles.setValue, { color: colors.ink }]}>
                  {set.reps}
                  <Text style={[styles.setUnit, { color: colors.muted }]}> reps</Text>
                </Text>
                {set.isPersonalRecord ? <Tag variant="accent" label="PR" /> : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingBottom: insets.bottom + 14 }]}>
        {isSummary ? (
          <Button label="Done" onPress={handleDone} variant="primary" fullWidth showArrow />
        ) : (
          <Button label="Repeat this session" onPress={handleRepeat} variant="primary" fullWidth showArrow />
        )}
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
      marginBottom: theme.spacing.sm,
    },
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display2,
      letterSpacing: -0.4,
      marginTop: 8,
    },
    divider: {
      height: 2,
    },
    statsRow: {
      flexDirection: 'row' as const,
    },
    statCell: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRightWidth: 2,
    },
    statLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    statValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1 - 4,
      marginTop: 7,
    },
    statUnit: {
      fontSize: theme.fontSize.md,
    },
    list: {
      flex: 1,
    },
    exerciseBlock: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      borderBottomWidth: 2,
    },
    exerciseName: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
      letterSpacing: -0.2,
      marginBottom: theme.spacing.sm,
    },
    setRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      paddingVertical: 7,
      borderBottomWidth: 1,
    },
    setNumber: {
      width: 20,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    setValue: {
      flex: 1,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.lg,
      fontVariant: ['tabular-nums' as const],
    },
    setUnit: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
    },
    footer: {
      borderTopWidth: 2,
      padding: theme.spacing.lg,
    },
  };
}
