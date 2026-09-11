import { Pressable, Text, View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      {onTogglePlateCalculator ? (
        <View style={styles.plateRow}>
          <Pressable
            onPress={onTogglePlateCalculator}
            accessibilityRole="button"
            accessibilityLabel="Toggle plate calculator"
            style={[styles.plateToggle, { borderColor: colors.divider }]}
          >
            <Text style={[styles.plateToggleLabel, { color: colors.ink }]} numberOfLines={1}>
              {isPlateCalculatorEnabled && plateSummary ? plateSummary : 'Plate calculator'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {GRID.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => onKeyPress(key)}
              accessibilityRole="button"
              accessibilityLabel={key === 'backspace' ? 'Delete' : key}
              style={({ pressed }) => [
                styles.key,
                { backgroundColor: colors.surface2 },
                pressed && styles.keyPressed,
              ]}
            >
              <Text style={[styles.keyLabel, { color: colors.ink }]}>{key === 'backspace' ? '⌫' : key}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable
        onPress={onNextSet}
        accessibilityRole="button"
        accessibilityLabel="Next set"
        style={({ pressed }) => [
          styles.nextSet,
          { backgroundColor: colors.accent },
          pressed && styles.keyPressed,
        ]}
      >
        <Text style={[styles.nextSetLabel, { color: colors.accentInk }]}>Next set</Text>
        <Text style={[styles.nextSetArrow, { color: colors.accentInk }]}>→</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      borderTopWidth: 2,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    plateRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    key: {
      flex: 1,
      minHeight: 52,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    keyPressed: {
      opacity: 0.7,
    },
    keyLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xxl,
    },
    plateToggle: {
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flex: 1,
    },
    plateToggleLabel: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.md,
    },
    nextSet: {
      minHeight: 52,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: theme.spacing.lg,
    },
    nextSetLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
    },
    nextSetArrow: {
      fontSize: theme.fontSize.xxl,
    },
  };
}
