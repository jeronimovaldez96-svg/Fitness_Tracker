import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getMonthStats,
  getTrainedDaysInMonth,
  listSessionsInRange,
} from '@/core/database/queries/history.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import type { MonthStats, SessionSummary } from '@/domains/workout/types/history.types';
import { addMonths, startOfMonth } from '@/shared/utils/dateBuckets';
import { formatMonthYear, formatShortDate } from '@/shared/utils/formatDate';
import { Tag } from '@/shared/components/Tag';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Cell = { key: string; day: number | null; trained: boolean; isToday: boolean };

function buildCalendarCells(monthStart: number): Cell[] {
  const date = new Date(monthStart);
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const cells: Cell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `blank-${i}`, day: null, trained: false, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      key: `day-${day}`,
      day,
      trained: false,
      isToday: isCurrentMonth && today.getDate() === day,
    });
  }
  return cells;
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const [monthOffset, setMonthOffset] = useState(0);
  const [cells, setCells] = useState<Cell[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats>({ sessionCount: 0, setCount: 0, volumeKg: 0 });
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [today] = useState(() => Date.now());

  const monthStart = addMonths(startOfMonth(today), -monthOffset);
  const monthEnd = addMonths(monthStart, 1);

  const load = useCallback(async () => {
    const [trainedDays, stats, monthSessions] = await Promise.all([
      getTrainedDaysInMonth(db, monthStart, monthEnd),
      getMonthStats(db, monthStart, monthEnd),
      listSessionsInRange(db, monthStart, monthEnd),
    ]);
    setCells(buildCalendarCells(monthStart).map((cell) => ({ ...cell, trained: cell.day !== null && trainedDays.has(cell.day) })));
    setMonthStats(stats);
    setSessions(monthSessions);
  }, [db, monthStart, monthEnd]);

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
        <Text style={[styles.title, { color: colors.ink }]}>History</Text>
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => setMonthOffset((o) => o + 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={[styles.monthNavButton, { borderColor: colors.divider }]}
          >
            <Text style={[styles.monthNavArrow, { color: colors.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.ink }]}>{formatMonthYear(monthStart)}</Text>
          <Pressable
            onPress={() => setMonthOffset((o) => Math.max(0, o - 1))}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={[styles.monthNavButton, { borderColor: colors.divider }]}
          >
            <Text style={[styles.monthNavArrow, { color: colors.ink }]}>›</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={[styles.weekdayRow, { borderBottomColor: colors.divider }]}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={[styles.weekdayLabel, { color: colors.ghost }]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((cell) => (
          <View
            key={cell.key}
            style={[
              styles.calendarCell,
              { borderColor: colors.soft, backgroundColor: cell.trained ? colors.ink : 'transparent' },
              cell.isToday && { borderBottomWidth: 4, borderBottomColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.calendarDay,
                {
                  color: cell.trained ? colors.bg : colors.ink,
                  fontFamily: cell.trained || cell.isToday ? theme.fontFamily.bold : theme.fontFamily.medium,
                },
              ]}
            >
              {cell.day ?? ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.statsRow}>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>SESSIONS</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{monthStats.sessionCount}</Text>
        </View>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>SETS</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>{monthStats.setCount}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>VOLUME</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>
            {(monthStats.volumeKg / 1000).toFixed(1)}
            <Text style={[styles.statUnit, { color: colors.muted }]}> t</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      {sessions.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.muted }]}>No sessions logged this month.</Text>
      ) : (
        sessions.map((session) => (
          <Pressable
            key={session.id}
            style={[styles.sessionRow, { borderBottomColor: colors.soft }]}
            onPress={() => router.push(`/session/${session.id}`)}
          >
            <View style={styles.sessionDate}>
              <Text style={[styles.sessionDay, { color: colors.ink }]}>
                {formatShortDate(session.startTime).split(' ')[0]}
              </Text>
              <Text style={[styles.sessionMonth, { color: colors.ghost }]}>
                {formatShortDate(session.startTime).split(' ')[1]}
              </Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionName, { color: colors.ink }]}>{session.title}</Text>
              <Text style={[styles.sessionMeta, { color: colors.muted }]}>
                {session.setCount} sets · {(session.volumeKg / 1000).toFixed(1)} t · {session.durationMinutes} min
              </Text>
            </View>
            {session.prCount > 0 ? (
              <Tag variant="accent" label={`${session.prCount} PR${session.prCount === 1 ? '' : 'S'}`} />
            ) : null}
            <Text style={[styles.sessionArrow, { color: colors.muted }]}>→</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
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
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display3,
      letterSpacing: -0.5,
    },
    monthNav: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 2,
    },
    monthNavButton: {
      width: 44,
      height: 44,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    monthNavArrow: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.lg,
    },
    monthLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      letterSpacing: 1,
      paddingHorizontal: theme.spacing.sm,
    },
    divider: {
      height: 2,
    },
    weekdayRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 2,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center' as const,
      paddingVertical: 8,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
    },
    calendarGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    calendarCell: {
      width: `${100 / 7}%` as const,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },
    calendarDay: {
      fontSize: theme.fontSize.md,
      fontVariant: ['tabular-nums' as const],
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
    emptyText: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      padding: theme.spacing.lg,
    },
    sessionRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: 1,
    },
    sessionDate: {
      width: 34,
    },
    sessionDay: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.lg,
    },
    sessionMonth: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.xs,
      marginTop: 3,
    },
    sessionInfo: {
      flex: 1,
      minWidth: 0,
    },
    sessionName: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.lg,
    },
    sessionMeta: {
      fontFamily: theme.fontFamily.regular,
      fontSize: theme.fontSize.sm,
      marginTop: 4,
    },
    sessionArrow: {
      fontSize: theme.fontSize.xxl,
    },
  };
}
