import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontSize, fontWeight, MIN_TOUCH_TARGET, radius, spacing } from '@/core/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANT_BACKGROUND: Record<ButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.surfaceElevated,
  success: colors.success,
  danger: colors.danger,
  ghost: 'transparent',
};

const VARIANT_TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.text,
  secondary: colors.text,
  success: colors.text,
  danger: colors.text,
  ghost: colors.primary,
};

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: VARIANT_BACKGROUND[variant] },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, { color: VARIANT_TEXT_COLOR[variant] }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
