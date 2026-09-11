/** Archivo, loaded via @expo-google-fonts/archivo in app/_layout.tsx (see useFonts call). */
export const fontFamily = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_800ExtraBold',
} as const;

export const fontSize = {
  xs: 9,
  sm: 11,
  md: 13,
  lg: 15,
  xl: 17,
  xxl: 20,
  display1: 28,
  display2: 34,
  display3: 40,
} as const;

/** Kept for call sites still on RN's numeric fontWeight; prefer fontFamily for Archivo's static weights. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '800',
} as const;
