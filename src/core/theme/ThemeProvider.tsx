import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useMMKVValue } from '@/core/storage/useMMKVValue';

import { fontFamily, fontSize, fontWeight } from './typography';
import { spacing } from './spacing';
import { DARK, LIGHT, MIN_TOUCH_TARGET, radius, type ThemeColors } from './tokens';

export type ThemeOverride = 'system' | 'light' | 'dark';

const THEME_OVERRIDE_KEY = 'theme-override';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  radius: typeof radius;
  minTouchTarget: number;
  isDark: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

/** Persisted override for the You screen's LIGHT/DARK segmented control; 'system' follows the OS. */
export function useThemeOverride(): [ThemeOverride, (value: ThemeOverride) => void] {
  return useMMKVValue<ThemeOverride>(THEME_OVERRIDE_KEY, 'system');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override] = useThemeOverride();

  const theme = useMemo<Theme>(() => {
    const isDark = override === 'system' ? systemScheme === 'dark' : override === 'dark';
    return {
      colors: isDark ? DARK : LIGHT,
      spacing,
      fontFamily,
      fontSize,
      fontWeight,
      radius,
      minTouchTarget: MIN_TOUCH_TARGET,
      isDark,
    };
  }, [override, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme() must be used within a ThemeProvider');
  return theme;
}
