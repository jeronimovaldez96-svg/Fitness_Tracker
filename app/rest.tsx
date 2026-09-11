import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';
import { useRestTimer } from '@/domains/workout/hooks/useRestTimer';
import { useActiveWorkoutStore } from '@/domains/workout/store/activeWorkoutStore';
import { Button } from '@/shared/components/Button';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function RestRoute() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isActive, remainingSeconds, progress, addSeconds, skip } = useRestTimer();
  const exercises = useActiveWorkoutStore((state) => state.exercises);

  const progressValue = useSharedValue(progress);
  useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 200, easing: Easing.linear });
  }, [progress, progressValue]);
  const barStyle = useAnimatedStyle(() => ({ width: `${progressValue.value * 100}%` }));

  useEffect(() => {
    if (!isActive) router.back();
  }, [isActive]);

  let upNext: { name: string; setOrder: number; weight: number | null; reps: number | null } | null = null;
  for (const exercise of exercises) {
    const next = exercise.sets.find((s) => !s.isCompleted);
    if (next) {
      upNext = {
        name: exercise.exerciseName,
        setOrder: next.setOrder,
        weight: next.weightKg ?? next.ghostWeightKg,
        reps: next.reps ?? next.ghostReps,
      };
      break;
    }
  }

  function handleBack() {
    router.back();
  }

  function handleAdjust(delta: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSeconds(delta);
  }

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skip();
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Button label="← SESSION" onPress={handleBack} variant="ghost" compact />
      </View>

      <View style={styles.center}>
        <Text style={[styles.kicker, { color: colors.accent }]}>RESTING</Text>
        <Text style={[styles.clock, { color: colors.ink }]}>{formatClock(remainingSeconds)}</Text>
        <View style={[styles.track, { backgroundColor: colors.soft }]}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, barStyle]} />
        </View>

        {upNext ? (
          <View style={[styles.upNext, { borderTopColor: colors.soft }]}>
            <Text style={[styles.upNextKicker, { color: colors.muted }]}>UP NEXT</Text>
            <Text style={[styles.upNextTitle, { color: colors.ink }]}>
              {upNext.name} · Set {upNext.setOrder}
            </Text>
            {upNext.weight !== null && upNext.reps !== null ? (
              <Text style={[styles.upNextMeta, { color: colors.muted }]}>
                {upNext.weight} kg × {upNext.reps}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Button label="−15" onPress={() => handleAdjust(-15)} variant="secondary" style={styles.footerButton} />
        <Button label="+30" onPress={() => handleAdjust(30)} variant="secondary" style={styles.footerButton} />
        <Button label="SKIP" onPress={handleSkip} variant="primary" compact style={styles.footerButton} />
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
    },
    center: {
      flex: 1,
      justifyContent: 'center' as const,
      paddingHorizontal: theme.spacing.lg,
    },
    kicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1.5,
    },
    clock: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 108,
      letterSpacing: -4,
      fontVariant: ['tabular-nums' as const],
      marginTop: 12,
    },
    track: {
      height: 3,
      marginTop: 22,
    },
    fill: {
      height: '100%' as const,
    },
    upNext: {
      marginTop: 26,
      borderTopWidth: 1,
      paddingTop: theme.spacing.md,
    },
    upNextKicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 1,
    },
    upNextTitle: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl + 2,
      marginTop: 9,
    },
    upNextMeta: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
      marginTop: 8,
    },
    footer: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    footerButton: {
      flex: 1,
    },
  };
}
