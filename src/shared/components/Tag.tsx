import { Text, View } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

export type TagVariant = 'accent' | 'neutral' | 'outline';

type TagProps = {
  label: string;
  variant?: TagVariant;
};

export function Tag({ label, variant = 'neutral' }: TagProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const containerStyle = {
    accent: { backgroundColor: colors.accent },
    neutral: { backgroundColor: colors.surface2 },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
  }[variant];

  const textColor = {
    accent: colors.accentInk,
    neutral: colors.muted,
    outline: colors.accent,
  }[variant];

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: theme.spacing.xs + 3,
      paddingVertical: 4,
    },
    label: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xs,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  };
}
