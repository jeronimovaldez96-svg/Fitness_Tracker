import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, radius, spacing } from '@/core/theme';

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
  return { text: '-', isGhost: false };
}

export function SetRow({ set, focusedField, onFocusField, onComplete }: SetRowProps) {
  const isWeightFocused = focusedField?.setId === set.id && focusedField.field === 'weight';
  const isRepsFocused = focusedField?.setId === set.id && focusedField.field === 'reps';

  const weight = fieldDisplay(set.draftWeight, set.weightKg, set.ghostWeightKg);
  const reps = fieldDisplay(set.draftReps, set.reps, set.ghostReps);

  return (
    <View style={styles.row}>
      <Text style={styles.setNumber}>{set.setOrder}</Text>

      <Pressable
        onPress={() => onFocusField(set.id, 'weight')}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.setOrder} weight`}
        style={[styles.field, isWeightFocused && styles.fieldFocused]}
      >
        <Text style={[styles.fieldText, weight.isGhost && styles.ghostText]}>{weight.text}</Text>
      </Pressable>

      <Pressable
        onPress={() => onFocusField(set.id, 'reps')}
        accessibilityRole="button"
        accessibilityLabel={`Set ${set.setOrder} reps`}
        style={[styles.field, isRepsFocused && styles.fieldFocused]}
      >
        <Text style={[styles.fieldText, reps.isGhost && styles.ghostText]}>{reps.text}</Text>
      </Pressable>

      <View style={styles.checkmarkWrapper}>
        <Pressable
          onPress={() => onComplete(set.id)}
          accessibilityRole="button"
          accessibilityLabel={`Complete set ${set.setOrder}`}
          style={[styles.checkmark, set.isCompleted && styles.checkmarkCompleted]}
        >
          <Text style={styles.checkmarkText}>✓</Text>
        </Pressable>

        {set.isPersonalRecord ? (
          <View style={styles.prBadge} accessibilityLabel="Personal record">
            <Text style={styles.prBadgeText}>PR</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  setNumber: {
    width: 24,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  field: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  fieldText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  ghostText: {
    color: colors.textGhost,
  },
  checkmarkWrapper: {
    position: 'relative',
  },
  checkmark: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCompleted: {
    backgroundColor: colors.success,
  },
  checkmarkText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  prBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  prBadgeText: {
    color: colors.background,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
});
