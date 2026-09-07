import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, radius, spacing } from '@/core/theme';

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
 */
export function RestTimerBanner() {
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
    <View style={styles.banner}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={() => handleAdjust(-15)}
          accessibilityRole="button"
          accessibilityLabel="Subtract 15 seconds"
          style={styles.adjustButton}
        >
          <Text style={styles.adjustLabel}>-15s</Text>
        </Pressable>

        <Text style={styles.countdown}>{formatClock(remainingSeconds)}</Text>

        <Pressable
          onPress={() => handleAdjust(30)}
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds"
          style={styles.adjustButton}
        >
          <Text style={styles.adjustLabel}>+30s</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          style={styles.skipButton}
        >
          <Text style={styles.skipLabel}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countdown: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  adjustButton: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  skipButton: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
