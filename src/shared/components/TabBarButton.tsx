import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

type TabBarButtonProps = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
};

/** Custom tabBarButton renderer for the 4-tab shell: flush-left label + a 4px accent bar when active, per the Modernist design. */
export function TabBarButton({ label, onPress, accessibilityState }: TabBarButtonProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useThemedStyles(createStyles);
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={[styles.container, { borderRightColor: colors.soft }]}
    >
      <View style={[styles.indicator, { backgroundColor: focused ? colors.accent : 'transparent' }]} />
      <Text
        style={[
          styles.label,
          {
            color: focused ? colors.ink : colors.muted,
            fontFamily: focused ? theme.fontFamily.bold : theme.fontFamily.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      flex: 1,
      minHeight: 62,
      alignItems: 'flex-start' as const,
      paddingTop: theme.spacing.md,
      paddingLeft: theme.spacing.md + 2,
      borderRightWidth: 1,
      gap: 7,
    },
    indicator: {
      width: 16,
      height: 4,
    },
    label: {
      fontSize: theme.fontSize.sm,
      letterSpacing: 0.4,
    },
  };
}
