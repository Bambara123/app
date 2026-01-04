// src/constants/spacing.ts
// 8px base unit system for consistent spacing

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Semantic spacing
export const layout = {
  // Screen padding
  screenPadding: spacing[4],
  screenPaddingLarge: spacing[6],
  
  // Card padding
  cardPadding: spacing[4],
  cardPaddingLarge: spacing[6],
  
  // Section spacing
  sectionGap: spacing[6],
  itemGap: spacing[3],
  
  // Input heights (larger for elderly users)
  inputHeight: 56,
  inputHeightLarge: 64,
  
  // Button heights
  buttonHeight: 52,
  buttonHeightLarge: 60,
  emergencyButtonSize: 120,
  
  // Tab bar
  tabBarHeight: 84,
  
  // Avatar sizes
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,
} as const;

// Border Radius
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

