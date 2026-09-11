import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getRecentPersonalRecords, getTopLiftsWithE1RMTrend, getVolumeSeries } from '@/core/database/queries/progress.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import type { LiftTrend, PersonalRecordEntry, ProgressRange, VolumeSeries } from '@/domains/workout/types/progress.types';
import { formatShortDate } from '@/shared/utils/formatDate';
import { BarChart } from '@/shared/components/BarChart';
import { Button } from '@/shared/components/Button';
import { SegmentedControl } from '@/shared/components/SegmentedControl';
import { Sparkline } from '@/shared/components/Sparkline';

const RANGE_OPTIONS: { label: string; value: ProgressRange }[] = [
  { label: '4W', value: '4W' },
  { label: '12W', value: '12W' },
  { label: '1Y', value: '1Y' },
];

export default function ProgressScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [range, setRange] = useState<ProgressRange>('12W');
  const [volume, setVolume] = useState<VolumeSeries | null>(null);
  const [lifts, setLifts] = useState<LiftTrend[]>([]);
  const [prLog, setPrLog] = useState<PersonalRecordEntry[]>([]);

  const load = useCallback(async () => {
    const [volumeSeries, liftTrends, records] = await Promise.all([
      getVolumeSeries(db, range),
      getTopLiftsWithE1RMTrend(db, range),
      getRecentPersonalRecords(db, 4),
    ]);
    setVolume(volumeSeries);
    setLifts(liftTrends);
    setPrLog(records);
  }, [db, range]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Progress</Text>
        <View style={styles.rangeControl}>
          <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {volume ? (
        <View style={styles.volumeSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>TOTAL VOLUME</Text>
            <Text style={[styles.volumeDelta, { color: colors.accent }]}>
              {volume.deltaPercent >= 0 ? '+' : ''}
              {volume.deltaPercent}%
            </Text>
          </View>
          <BarChart values={volume.bars} height={96} />
          <View style={styles.axisRow}>
            <Text style={[styles.axisLabel, { color: colors.ghost }]}>{volume.fromLabel}</Text>
            <Text style={[styles.axisLabel, { color: colors.ghost }]}>{volume.toLabel}</Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.liftsSection}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>ESTIMATED 1RM · KG</Text>
        {lifts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Log a few more sets (30 reps or fewer) to see 1RM trends here.
          </Text>
        ) : (
          lifts.map((lift) => (
            <View key={lift.exerciseId} style={[styles.liftRow, { borderBottomColor: colors.soft }]}>
              <View style={styles.liftInfo}>
                <Text style={[styles.liftName, { color: colors.ink }]}>{lift.name}</Text>
                <View style={styles.liftValueRow}>
                  <Text style={[styles.liftValue, { color: colors.ink }]}>{lift.latestE1rm}</Text>
                  <Text
                    style={[
                      styles.liftDelta,
                      { color: lift.deltaKg < 0 ? colors.muted : colors.accent },
                    ]}
                  >
                    {lift.deltaKg >= 0 ? '+' : ''}
                    {lift.deltaKg}
                  </Text>
                </View>
              </View>
              <Sparkline values={lift.series} />
            </View>
          ))
        )}
      </View>

      <View style={styles.prSection}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>RECENT PERSONAL RECORDS</Text>
        <View style={[styles.prList, { borderTopColor: colors.soft }]}>
          {prLog.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No personal records yet.</Text>
          ) : (
            prLog.map((pr) => (
              <View key={pr.id} style={[styles.prRow, { borderBottomColor: colors.soft }]}>
                <Text style={[styles.prDate, { color: colors.ghost }]}>{formatShortDate(pr.date)}</Text>
                <Text style={[styles.prLift, { color: colors.ink }]}>{pr.exerciseName}</Text>
                <Text style={[styles.prValue, { color: colors.ink }]}>
                  {pr.weightKg} kg × {pr.reps}
                </Text>
              </View>
            ))
          )}
        </View>
        <Button
          label="Body metrics"
          onPress={() => router.push('/body-metrics')}
          variant="secondary"
          fullWidth
          showArrow
          style={styles.bodyMetricsButton}
        />
      </View>
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
    },
    rangeControl: {
      marginTop: theme.spacing.md,
    },
    divider: {
      height: 2,
    },
    volumeSection: {
      padding: theme.spacing.lg,
    },
    sectionHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      justifyContent: 'space-between' as const,
    },
    sectionLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    volumeDelta: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.sm,
      fontVariant: ['tabular-nums' as const],
    },
    axisRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 6,
    },
    axisLabel: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.xs,
      letterSpacing: 0.4,
    },
    liftsSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: 4,
    },
    emptyText: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      marginTop: theme.spacing.sm,
    },
    liftRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      paddingVertical: 13,
      borderBottomWidth: 1,
    },
    liftInfo: {
      flex: 1,
      minWidth: 0,
    },
    liftName: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    liftValueRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: 7,
      marginTop: 5,
    },
    liftValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
      fontVariant: ['tabular-nums' as const],
    },
    liftDelta: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.sm,
      fontVariant: ['tabular-nums' as const],
    },
    prSection: {
      padding: theme.spacing.lg,
    },
    prList: {
      borderTopWidth: 1,
      marginTop: theme.spacing.sm,
    },
    prRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      paddingVertical: 11,
      borderBottomWidth: 1,
    },
    prDate: {
      width: 52,
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
      letterSpacing: 0.3,
    },
    prLift: {
      flex: 1,
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.md,
    },
    prValue: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
    },
    bodyMetricsButton: {
      marginTop: theme.spacing.lg,
    },
  };
}
