import { Pressable, Text, View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

type SegmentedControlProps<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.container, { borderColor: colors.divider }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && { backgroundColor: colors.ink }]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.bg : colors.muted,
                  fontFamily: active ? theme.fontFamily.bold : theme.fontFamily.semibold,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flexDirection: 'row' as const,
      borderWidth: 1,
      alignSelf: 'flex-start' as const,
    },
    option: {
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    label: {
      fontSize: theme.fontSize.sm,
      letterSpacing: 0.5,
    },
  };
}
