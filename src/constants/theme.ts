// src/constants/theme.ts
// Unified theme export

import { Platform } from 'react-native';
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, layout, radius } from './spacing';

// Shadow styles
export const shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }),
};

// Icon sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

// Icon mappings for reminder labels
export const reminderIcons: Record<string, string> = {
  medicine: 'medical',
  meal: 'restaurant',
  doctor: 'medkit',
  exercise: 'fitness',
  other: 'notifications',
};

// Tab bar icons
export const tabIcons = {
  home: { active: 'home', inactive: 'home-outline' },
  reminders: { active: 'alarm', inactive: 'alarm-outline' },
  chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  album: { active: 'images', inactive: 'images-outline' },
} as const;

// Mood icons
export const moodIcons: Record<string, string> = {
  happy: 'happy',
  neutral: 'remove-circle',
  sad: 'sad',
  tired: 'moon',
};

// Animation durations
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Export everything
export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  layout,
  radius,
  shadows,
  iconSizes,
  animation,
} as const;

export { colors, typography, textStyles, spacing, layout, radius };
export type Theme = typeof theme;

