// src/constants/typography.ts
// ElderCare Typography System

import { colors } from './colors';

export const typography = {
  // Font Families
  fontFamily: {
    serif: 'PlayfairDisplay',
    serifItalic: 'PlayfairDisplay-Italic',
    serifBold: 'PlayfairDisplay-Bold',
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Font Sizes (larger for elderly users)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.5,
  },
} as const;

// Pre-defined text styles
export const textStyles = {
  // Display/Hero text (Serif - for section titles like "The Vault", "The Bridge")
  display: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
  },
  
  // Greeting text (Serif - "Good Morning, Dad")
  greeting: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.normal,
  },
  
  // Italic quote text (Serif Italic - for memories/quotes)
  quote: {
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
    fontStyle: 'italic' as const,
  },
  
  // Highlighted name (Serif Italic - "Dad" in greeting)
  nameHighlight: {
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.regular,
    color: colors.primary[500],
    fontStyle: 'italic' as const,
  },
  
  // Headings (Sans-serif)
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.normal,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  },
  
  // Body
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  
  // Labels (All caps, spaced - "DAD'S RHYTHM", "SPARK A THOUGHT")
  labelUppercase: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xs * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // Captions
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  },
  
  // Date/Time display
  dateDisplay: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.primary[500],
  },
  
  // Buttons
  buttonLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.base * typography.lineHeight.tight,
  },
} as const;

