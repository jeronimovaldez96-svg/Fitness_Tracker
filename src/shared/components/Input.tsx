import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...textInputProps }: InputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.ghost}
        style={[
          styles.input,
          { borderColor: error ? colors.accent : colors.divider, backgroundColor: colors.surface, color: colors.ink },
          style,
        ]}
        {...textInputProps}
      />
      {error ? <Text style={[styles.error, { color: colors.accent }]}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return {
    container: {
      gap: theme.spacing.xs,
    },
    label: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.sm,
    },
    input: {
      minHeight: theme.minTouchTarget,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.lg,
    },
    error: {
      fontFamily: theme.fontFamily.medium,
      fontSize: theme.fontSize.xs,
    },
  };
}
