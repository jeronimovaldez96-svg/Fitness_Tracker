import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listRoutines } from '@/core/database/queries/routines.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import type { RoutineSummary } from '@/domains/workout/types/routine.types';
import { formatShortDate } from '@/shared/utils/formatDate';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';

export default function PlansRoute() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listRoutines(db).then((rows) => {
        if (!cancelled) setRoutines(rows);
      });
      return () => {
        cancelled = true;
      };
    }, [db])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button label="← TRAIN" onPress={() => router.back()} variant="ghost" compact style={styles.backButton} />
        <Text style={[styles.title, { color: colors.ink }]}>Plans</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <ScrollView>
        {routines.map((routine) => (
          <Pressable
            key={routine.id}
            style={[styles.row, { borderBottomColor: colors.soft }]}
            onPress={() => router.push(`/plan/${routine.id}`)}
          >
            <Text style={[styles.rowDay, { color: colors.muted }]}>{routine.dayLabel ?? ''}</Text>
            <View style={styles.rowInfo}>
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowName, { color: colors.ink }]}>{routine.name}</Text>
                {routine.isNext ? <Tag variant="accent" label="NEXT" /> : null}
              </View>
              <Text style={[styles.rowMeta, { color: colors.muted }]}>
                {routine.exerciseCount} exercises · ~{routine.estimatedMinutes} min · last{' '}
                {routine.lastUsedAt ? formatShortDate(routine.lastUsedAt) : 'never'}
              </Text>
            </View>
            <Text style={[styles.rowArrow, { color: colors.muted }]}>→</Text>
          </Pressable>
        ))}

        <View style={styles.footer}>
          <Button
            label="+ New plan"
            onPress={() => router.push('/plan/edit')}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
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
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
      marginTop: 6,
    },
    divider: {
      height: 2,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    rowDay: {
      width: 42,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 0.5,
    },
    rowInfo: {
      flex: 1,
      minWidth: 0,
    },
    rowTitleLine: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: theme.spacing.sm,
    },
    rowName: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl - 2,
      letterSpacing: -0.2,
    },
    rowMeta: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.sm,
      marginTop: 6,
    },
    rowArrow: {
      fontSize: theme.fontSize.xxl,
    },
    footer: {
      padding: theme.spacing.lg,
    },
  };
}
