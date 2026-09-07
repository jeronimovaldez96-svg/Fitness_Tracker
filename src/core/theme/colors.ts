export const colors = {
  background: '#0B0D10',
  surface: '#16191E',
  surfaceElevated: '#20242B',
  border: '#2B303A',

  text: '#F5F6F8',
  textMuted: '#9AA1AC',
  textGhost: '#5A606C',

  primary: '#3B82F6',
  primaryMuted: '#1E3A5F',

  success: '#22C55E',
  successMuted: '#123321',

  danger: '#EF4444',
  warning: '#F59E0B',

  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorToken = keyof typeof colors;
