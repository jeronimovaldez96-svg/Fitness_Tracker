import { Pressable, Text, View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

import type { ActiveSet, FocusedField } from '../types/workout.types';

type SetRowProps = {
  set: ActiveSet;
  focusedField: FocusedField | null;
  onFocusField: (setId: string, field: 'weight' | 'reps') => void;
  onComplete: (setId: string) => void;
};

function fieldDisplay(
  draft: string,
  committed: number | null,
  ghost: number | null
): { text: string; isGhost: boolean } {
  if (draft !== '') return { text: draft, isGhost: false };
  if (committed !== null) return { text: String(committed), isGhost: false };
  if (ghost !== null) return { text: String(ghost), isGhost: true };
  return { text: '—', isGhost: false };
}

export function SetRow({ set, focusedField, onFocusField, onComplete }: SetRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isWeightFocused = focusedField?.setId === set.id && focusedField.field === 'weight';
  const isRepsFocused = focusedField?.setId === set.id && focusedField.field === 'reps';

  const weight = fieldDisplay(set.draftWeight, set.weightKg, set.ghostWeightKg);
  const reps = fieldDisplay(set.draftReps, set.reps, set.ghostReps);

  return (
    <View style={[styles.row, { borderBottomColor: colors.soft }]}>
      <Text style={[styles.setNumber, { color: colors.muted }]}>{set.setOrder}</Text>

      <Pressable
        onPress={() => onFocusField(set.id, 'weight')}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.setOrder} weight`}
        style={[styles.field, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.fieldText, { color: weight.isGhost ? colors.ghost : colors.ink }]}>
          {weight.text}
        </Text>
        {isWeightFocused ? <View style={[styles.focusBar, { backgroundColor: colors.accent }]} /> : null}
      </Pressable>

      <Pressable
        onPress={() => onFocusField(set.id, 'reps')}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.setOrder} reps`}
        style={[styles.field, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.fieldText, { color: reps.isGhost ? colors.ghost : colors.ink }]}>
          {reps.text}
        </Text>
        {isRepsFocused ? <View style={[styles.focusBar, { backgroundColor: colors.accent }]} /> : null}
      </Pressable>

      <View style={styles.checkmarkWrapper}>
        <Pressable
          onPress={() => onComplete(set.id)}
          accessibilityRole="button"
          accessibilityLabel={`Complete set ${set.setOrder}`}
          style={[styles.checkmark, { backgroundColor: colors.surface }]}
        >
          {set.isCompleted ? (
            <View style={[styles.checkmarkFilled, { backgroundColor: colors.ink }]}>
              <Text style={[styles.checkmarkText, { color: colors.bg }]}>✓</Text>
            </View>
          ) : (
            <View style={[styles.checkmarkOutline, { borderColor: colors.ghost }]} />
          )}
        </Pressable>

        {set.isPersonalRecord ? (
          <View style={[styles.prBadge, { backgroundColor: colors.accent }]} accessibilityLabel="Personal record">
            <Text style={[styles.prBadgeText, { color: colors.accentInk }]}>PR</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs + 2,
      borderBottomWidth: 1,
    },
    setNumber: {
      width: 22,
      textAlign: 'center' as const,
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
    },
    field: {
      flex: 1,
      minHeight: theme.minTouchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
    },
    fieldText: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
    },
    focusBar: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
    },
    checkmarkWrapper: {
      width: theme.minTouchTarget,
      position: 'relative' as const,
    },
    checkmark: {
      width: theme.minTouchTarget,
      height: theme.minTouchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkmarkFilled: {
      width: theme.minTouchTarget,
      height: theme.minTouchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkmarkOutline: {
      width: 16,
      height: 16,
      borderWidth: 2,
    },
    checkmarkText: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
    },
    prBadge: {
      position: 'absolute' as const,
      top: -5,
      right: -8,
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    prBadgeText: {
      fontFamily: theme.fontFamily.bold,
      fontSize: 8,
      letterSpacing: 0.5,
    },
  };
}
