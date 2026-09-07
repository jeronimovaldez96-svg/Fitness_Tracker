import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, radius, spacing } from '@/core/theme';

export type NumericPadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'backspace';

type NumericPadProps = {
  onKeyPress: (key: NumericPadKey) => void;
  onNextSet: () => void;
  isPlateCalculatorEnabled?: boolean;
  onTogglePlateCalculator?: () => void;
  plateSummary?: string;
};

const GRID: NumericPadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export function NumericPad({
  onKeyPress,
  onNextSet,
  isPlateCalculatorEnabled = false,
  onTogglePlateCalculator,
  plateSummary,
}: NumericPadProps) {
  return (
    <View>
      {onTogglePlateCalculator ? (
        <Pressable
          onPress={onTogglePlateCalculator}
          accessibilityRole="button"
          accessibilityLabel="Toggle plate calculator"
          style={[styles.plateToggle, isPlateCalculatorEnabled && styles.plateToggleActive]}
        >
          <Text style={styles.plateToggleLabel}>
            {isPlateCalculatorEnabled && plateSummary ? plateSummary : 'Plates'}
          </Text>
        </Pressable>
      ) : null}

      {GRID.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => onKeyPress(key)}
              accessibilityRole="button"
              accessibilityLabel={key === 'backspace' ? 'Delete' : key}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <Text style={styles.keyLabel}>{key === 'backspace' ? '⌫' : key}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable
        onPress={onNextSet}
        accessibilityRole="button"
        accessibilityLabel="Next set"
        style={({ pressed }) => [styles.nextSet, pressed && styles.keyPressed]}
      >
        <Text style={styles.nextSetLabel}>Next Set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  key: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    opacity: 0.7,
  },
  keyLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  plateToggle: {
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  plateToggleActive: {
    backgroundColor: colors.primaryMuted,
  },
  plateToggleLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  nextSet: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSetLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
