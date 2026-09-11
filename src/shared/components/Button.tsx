import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useThemedStyles, useTheme, type Theme } from '@/core/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Small uppercase utility style (FINISH, SKIP, EDIT, -15) instead of the large sentence-case CTA style. */
  compact?: boolean;
  fullWidth?: boolean;
  /** Trailing → glyph in a space-between layout. Only meaningful with fullWidth. */
  showArrow?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  compact = false,
  fullWidth = false,
  showArrow = false,
  disabled,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const variantStyle = {
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    secondary: { backgroundColor: 'transparent', borderColor: colors.divider },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
    danger: { backgroundColor: 'transparent', borderColor: colors.accent },
  }[variant];

  const textColor = {
    primary: colors.accentInk,
    secondary: colors.ink,
    ghost: colors.accent,
    danger: colors.accent,
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        variantStyle,
        variant !== 'ghost' && styles.bordered,
        fullWidth && styles.fullWidth,
        fullWidth && { justifyContent: showArrow ? 'space-between' : 'flex-start' },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[compact ? styles.compactLabel : styles.regularLabel, { color: textColor }]}>
        {label}
      </Text>
      {fullWidth && showArrow ? <Text style={[styles.arrow, { color: textColor }]}>→</Text> : null}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return {
    base: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minWidth: theme.minTouchTarget,
      borderRadius: theme.radius.md,
    },
    bordered: {
      borderWidth: 1,
    },
    regular: {
      minHeight: theme.minTouchTarget,
      paddingHorizontal: theme.spacing.lg,
    },
    compact: {
      minHeight: 44,
      paddingHorizontal: theme.spacing.md,
    },
    fullWidth: {
      width: '100%' as const,
      paddingHorizontal: 20,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.75,
    },
    regularLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.xl,
      letterSpacing: -0.2,
    },
    compactLabel: {
      fontFamily: theme.fontFamily.bold,
      fontSize: theme.fontSize.md,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    arrow: {
      fontSize: theme.fontSize.xxl,
    },
  };
}
