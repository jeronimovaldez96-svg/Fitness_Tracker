import { useMemo } from 'react';

import { useTheme, type Theme } from './ThemeProvider';

/**
 * Builds a StyleSheet (or any style object) from the active theme, recomputed
 * only when the theme reference changes (light/dark toggle or system change) —
 * not on every render. Lets components keep the existing
 * `const styles = StyleSheet.create({...})` shape, just moved inside the
 * component body and fed the live theme instead of the old static `colors`.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(theme), [theme]);
}
