import { View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

type BarChartProps = {
  values: number[];
  height?: number;
  /** Renders the final bar in the accent color instead of the muted fill — matches the design's charts. */
  highlightLast?: boolean;
};

export function BarChart({ values, height = 76, highlightLast = true }: BarChartProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const max = Math.max(1, ...values);

  return (
    <View style={[styles.container, { height, borderColor: colors.divider }]}>
      {values.map((value, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: `${Math.max(2, (value / max) * 100)}%`,
              backgroundColor: highlightLast && index === values.length - 1 ? colors.accent : colors.soft,
            },
          ]}
        />
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      gap: theme.spacing.xs + 2,
      borderBottomWidth: 2,
    },
    bar: {
      flex: 1,
    },
  };
}
