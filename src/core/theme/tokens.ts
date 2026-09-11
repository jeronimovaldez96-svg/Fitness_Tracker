/**
 * Modernist design tokens — derived from the Claude Design handoff
 * (Fitness Tracker Redesign.dc.html and its Modernist design-system stylesheet).
 * Flat, zero-radius, one red accent, strong 2px dividers. Light and dark
 * share the same shape so useTheme() can switch between them without any
 * consumer branching on isDark.
 */
export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  ghost: string;
  divider: string;
  soft: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  accentDeep: string;
  overlay: string;
};

export const LIGHT: ThemeColors = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  surface2: '#e0dede',
  ink: '#201e1d',
  muted: '#605d5d',
  ghost: '#9b9797',
  divider: 'rgba(32,30,29,.4)',
  soft: 'rgba(32,30,29,.14)',
  accent: '#ec3013',
  accentInk: '#f3f2f2',
  accentSoft: '#ffe0d9',
  accentDeep: '#ae1800',
  overlay: 'rgba(45,43,43,.5)',
};

export const DARK: ThemeColors = {
  bg: '#201e1d',
  surface: '#2d2b2b',
  surface2: '#444141',
  ink: '#f8f4f4',
  muted: '#bab6b6',
  ghost: '#7d7979',
  divider: 'rgba(248,244,244,.34)',
  soft: 'rgba(248,244,244,.13)',
  accent: '#ff563c',
  accentInk: '#201e1d',
  accentSoft: '#4d170e',
  accentDeep: '#ff9783',
  overlay: 'rgba(0,0,0,.6)',
};

export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  pill: 0,
} as const;

/** TRD 5.2: every touch target for in-gym one-thumb operation must be at least 48x48dp. */
export const MIN_TOUCH_TARGET = 48;
