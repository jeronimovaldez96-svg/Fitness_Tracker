import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getSessionsThisWeekCount, getStreakWeeks, getWeeklyVolumeSeries, listRecentSessions } from '@/core/database/queries/history.queries';
import { listRoutines, getRoutineWithExercises } from '@/core/database/queries/routines.queries';
import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { useActiveWorkoutStore } from '@/domains/workout/store/activeWorkoutStore';
import type { RoutineDetail, RoutineSummary } from '@/domains/workout/types/routine.types';
import type { SessionSummary } from '@/domains/workout/types/history.types';
import { formatFullDateUpper, formatShortDate } from '@/shared/utils/formatDate';
import { BarChart } from '@/shared/components/BarChart';
import { Button } from '@/shared/components/Button';
import { Tag } from '@/shared/components/Tag';

const WEEKLY_TARGET = 5;
const PREVIEW_EXERCISE_LIMIT = 4;

// Module-level (not React state): survives re-renders and tab switches for
// the lifetime of the JS process, but resets on a true cold start — exactly
// the "did we already check for a crashed session this launch?" flag we want.
let hasCheckedBootResume = false;

type DashboardData = {
  streakWeeks: number;
  sessionsThisWeek: number;
  weeklyVolumeKg: number;
  volumeBars: number[];
  nextRoutine: RoutineSummary | null;
  nextRoutineDetail: RoutineDetail | null;
  recentSessions: SessionSummary[];
};

export default function HomeScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const workoutId = useActiveWorkoutStore((state) => state.workoutId);
  const activeWorkoutTitle = useActiveWorkoutStore((state) => state.title);
  const startWorkout = useActiveWorkoutStore((state) => state.startWorkout);
  const startWorkoutFromRoutine = useActiveWorkoutStore((state) => state.startWorkoutFromRoutine);
  const [data, setData] = useState<DashboardData | null>(null);
  const [today] = useState(() => Date.now());

  useEffect(() => {
    if (!hasCheckedBootResume) {
      hasCheckedBootResume = true;
      if (workoutId) {
        // push (not replace) so Home stays underneath in the back stack,
        // consistent with the manual "Resume Workout" button below.
        router.push('/active-session');
      }
    }
    // Only ever act on the boot-time value, once — not on every workoutId
    // change while the app keeps running (e.g. finishing a workout later, or
    // navigating back to Home mid-session, shouldn't bounce the user back in).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    const [streakWeeks, sessionsThisWeek, volumeSeries, routines, recentSessions] = await Promise.all([
      getStreakWeeks(db),
      getSessionsThisWeekCount(db),
      getWeeklyVolumeSeries(db, 8),
      listRoutines(db),
      listRecentSessions(db, 3),
    ]);

    const nextRoutine = routines.find((r) => r.isNext) ?? routines[0] ?? null;
    const nextRoutineDetail = nextRoutine ? await getRoutineWithExercises(db, nextRoutine.id) : null;

    setData({
      streakWeeks,
      sessionsThisWeek,
      weeklyVolumeKg: volumeSeries[volumeSeries.length - 1]?.volumeKg ?? 0,
      volumeBars: volumeSeries.map((v) => v.volumeKg),
      nextRoutine,
      nextRoutineDetail,
      recentSessions,
    });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!data) {
    return <View style={[styles.container, { backgroundColor: colors.bg }]} />;
  }

  const previewExercises = data.nextRoutineDetail?.exercises.slice(0, PREVIEW_EXERCISE_LIMIT) ?? [];
  const extraCount = (data.nextRoutineDetail?.exercises.length ?? 0) - previewExercises.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.accent }]}>{formatFullDateUpper(today)}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Today</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.statsRow}>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>STREAK</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>
            {data.streakWeeks}
            <Text style={[styles.statUnit, { color: colors.muted }]}> wk</Text>
          </Text>
        </View>
        <View style={[styles.statCell, { borderRightColor: colors.divider }]}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>THIS WEEK</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>
            {data.sessionsThisWeek}
            <Text style={[styles.statUnit, { color: colors.muted }]}>/{WEEKLY_TARGET}</Text>
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>VOLUME</Text>
          <Text style={[styles.statValue, { color: colors.ink }]}>
            {(data.weeklyVolumeKg / 1000).toFixed(1)}
            <Text style={[styles.statUnit, { color: colors.muted }]}> t</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={[styles.upNextCard, { backgroundColor: colors.surface }]}>
        {workoutId ? (
          // A session is already running (e.g. the user backed out of it
          // earlier). Resuming must never call startWorkout*/startWorkoutFromRoutine
          // again — that would create a second in-progress workout row
          // alongside this one.
          <>
            <Text style={[styles.upNextKicker, { color: colors.accent }]}>WORKOUT IN PROGRESS</Text>
            <View style={styles.upNextTitleRow}>
              <Text style={[styles.upNextTitle, { color: colors.ink }]}>{activeWorkoutTitle || 'Workout'}</Text>
            </View>
            <Button
              label="Resume workout"
              onPress={() => router.push('/active-session')}
              variant="primary"
              fullWidth
              showArrow
            />
          </>
        ) : data.nextRoutine ? (
          <>
            <View>
              <Text style={[styles.upNextKicker, { color: colors.accent }]}>
                UP NEXT{data.nextRoutine.dayLabel ? ` · ${data.nextRoutine.dayLabel}` : ''}
              </Text>
              <View style={styles.upNextTitleRow}>
                <Text style={[styles.upNextTitle, { color: colors.ink }]}>{data.nextRoutine.name}</Text>
                <Text style={[styles.upNextMeta, { color: colors.muted }]}>
                  {data.nextRoutine.exerciseCount} exercises · ~{data.nextRoutine.estimatedMinutes} min
                </Text>
              </View>
            </View>
            <View style={[styles.exerciseList, { borderTopColor: colors.soft }]}>
              {previewExercises.map((ex) => (
                <View key={ex.id} style={[styles.exerciseRow, { borderBottomColor: colors.soft }]}>
                  <Text style={[styles.exerciseName, { color: colors.ink }]}>{ex.exerciseName}</Text>
                  <Text style={[styles.exerciseMeta, { color: colors.muted }]}>
                    {ex.targetSets} × {ex.targetReps}
                    {ex.targetWeightKg ? ` · ${ex.targetWeightKg} kg` : ''}
                  </Text>
                </View>
              ))}
              {extraCount > 0 ? (
                <View style={styles.exerciseRow}>
                  <Text style={[styles.exerciseMore, { color: colors.muted }]}>+ {extraCount} more</Text>
                </View>
              ) : null}
            </View>
            <Button
              label="Start workout"
              onPress={() => void startWorkoutFromRoutine(db, data.nextRoutine!.id).then(() => router.push('/active-session'))}
              variant="primary"
              fullWidth
              showArrow
            />
            <View style={styles.upNextActionsRow}>
              <Button
                label="View plan"
                onPress={() => router.push(`/plan/${data.nextRoutine!.id}`)}
                variant="secondary"
                style={styles.upNextActionButton}
              />
              <Button
                label="All plans"
                onPress={() => router.push('/plans')}
                variant="secondary"
                style={styles.upNextActionButton}
              />
            </View>
          </>
        ) : (
          <Button
            label="Start workout"
            onPress={() => void startWorkout(db).then(() => router.push('/active-session'))}
            variant="primary"
            fullWidth
            showArrow
          />
        )}
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <View style={styles.volumeSection}>
        <Button
          label="VOLUME · LAST 8 WEEKS →"
          onPress={() => router.push('/(tabs)/progress')}
          variant="ghost"
          compact
          style={styles.volumeLink}
        />
        <BarChart values={data.volumeBars} />
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>RECENT SESSIONS</Text>
          <Button label="ALL →" onPress={() => router.push('/(tabs)/history')} variant="ghost" compact />
        </View>
        <View style={[styles.sessionList, { borderTopColor: colors.soft }]}>
          {data.recentSessions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No sessions logged yet.</Text>
          ) : (
            data.recentSessions.map((session) => (
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
              </Pressable>
            ))
          )}
        </View>
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
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1.5,
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
      fontSize: theme.fontSize.display1,
      marginTop: 6,
    },
    statUnit: {
      fontSize: theme.fontSize.md,
    },
    upNextCard: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    upNextKicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    upNextTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      gap: theme.spacing.sm,
      marginTop: 8,
    },
    upNextTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1,
      letterSpacing: -0.5,
    },
    upNextMeta: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
    },
    exerciseList: {
      borderTopWidth: 1,
    },
    exerciseRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 9,
      borderBottomWidth: 1,
    },
    exerciseName: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
    },
    exerciseMeta: {
      fontFamily: theme.fontFamily.semibold,
      fontSize: theme.fontSize.sm,
    },
    exerciseMore: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
    },
    upNextActionsRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.md,
    },
    upNextActionButton: {
      flex: 1,
    },
    volumeSection: {
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: 4,
    },
    volumeLink: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: 0,
      letterSpacing: 1,
    },
    recentSection: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    recentHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'baseline' as const,
      marginBottom: theme.spacing.sm,
    },
    sectionLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    sessionList: {
      borderTopWidth: 1,
    },
    sessionRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
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
    emptyText: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      paddingVertical: theme.spacing.lg,
    },
  };
}
