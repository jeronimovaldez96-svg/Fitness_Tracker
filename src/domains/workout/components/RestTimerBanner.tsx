import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

import { useRestTimer } from '../hooks/useRestTimer';

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Non-modal floating indicator (TRD 5.2). Rendered inline at the bottom of the
 * screen layout, above the numeric keypad panel when both are visible, so it
 * never blocks taps the way a Modal-based sheet would (see M4 keypad fix).
 * Tapping the clock pushes the full-screen /rest route for an expanded view.
 */
export function RestTimerBanner() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isActive, remainingSeconds, progress, addSeconds, skip } = useRestTimer();

  const progressValue = useSharedValue(progress);
  useEffect(() => {
    progressValue.value = withTiming(progress, { duration: 200, easing: Easing.linear });
  }, [progress, progressValue]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  if (!isActive) return null;

  function handleSkip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skip();
  }

  function handleAdjust(delta: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSeconds(delta);
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
      <View style={[styles.track, { backgroundColor: colors.soft }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.accent }, barStyle]} />
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={() => handleAdjust(-15)}
          accessibilityRole="button"
          accessibilityLabel="Subtract 15 seconds"
          style={[styles.adjustButton, { borderColor: colors.divider }]}
        >
          <Text style={[styles.adjustLabel, { color: colors.ink }]}>−15</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/rest')}
          accessibilityRole="button"
          accessibilityLabel="Expand rest timer"
          style={styles.clockButton}
        >
          <Text style={[styles.clockKicker, { color: colors.muted }]}>REST · TAP TO EXPAND</Text>
          <Text style={[styles.countdown, { color: colors.ink }]}>{formatClock(remainingSeconds)}</Text>
        </Pressable>

        <Pressable
          onPress={() => handleAdjust(30)}
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds"
          style={[styles.adjustButton, { borderColor: colors.divider }]}
        >
          <Text style={[styles.adjustLabel, { color: colors.ink }]}>+30</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          style={[styles.skipButton, { backgroundColor: colors.accent }]}
        >
          <Text style={[styles.skipLabel, { color: colors.accentInk }]}>SKIP</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    banner: {
      borderTopWidth: 2,
    },
    track: {
      height: 3,
    },
    fill: {
      height: '100%' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    clockButton: {
      flex: 1,
      minWidth: 0,
      minHeight: theme.minTouchTarget,
    },
    clockKicker: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 8,
      letterSpacing: 1,
    },
    countdown: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.display1 + 6,
      fontVariant: ['tabular-nums' as const],
      marginTop: 5,
    },
    adjustButton: {
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    adjustLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
    },
    skipButton: {
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    skipLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      letterSpacing: 1,
    },
  };
}
