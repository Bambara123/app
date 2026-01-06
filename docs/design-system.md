# Design System

Complete design system for ElderCare application with accessibility-first approach for elderly users.

**Design Inspiration:** Warm, emotional, family-oriented aesthetic with elegant typography and soft rose accents.

---

## Design Principles

1. **Warmth & Emotion** - Rose/coral colors evoke love, care, and family connection
2. **Elegance** - Serif fonts for headings create a timeless, personal feel
3. **Accessibility First** - Large touch targets, readable fonts, high contrast
4. **Simplicity** - Clear hierarchy, minimal cognitive load
5. **Consistency** - Unified patterns across all screens
6. **Feedback** - Clear visual and haptic responses

---

## Color Palette

### Primary Colors

```typescript
// src/constants/colors.ts

export const colors = {
  // Primary - Warm Rose/Coral (main brand color)
  primary: {
    50: '#FFF5F6',
    100: '#FFE8EA',
    200: '#FFCCD2',
    300: '#FFAAB4',
    400: '#F4808C',
    500: '#E85A6B',  // Main primary - Warm Rose
    600: '#D64455',
    700: '#B83344',
    800: '#992536',
    900: '#7A1A2A',
  },
  
  // Secondary - Soft Cream/Warm Neutral
  secondary: {
    50: '#FFFDFB',
    100: '#FBF9F7',   // Main background
    200: '#F5F0EB',
    300: '#EBE4DD',
    400: '#DDD4CA',
    500: '#C9BEB2',
    600: '#A89A8C',
    700: '#877A6E',
    800: '#665C52',
    900: '#453E38',
  },
  
  // Accent - Sky Blue (for Son's elements)
  accent: {
    light: '#E3F2FD',
    main: '#64B5F6',
    dark: '#1E88E5',
  },
  
  // Semantic Colors
  success: {
    light: '#E8F5E9',
    main: '#4CAF50',
    dark: '#2E7D32',
  },
  
  warning: {
    light: '#FFF8E1',
    main: '#FFC107',
    dark: '#F57C00',
  },
  
  danger: {
    light: '#FFEBEE',
    main: '#EF5350',
    dark: '#C62828',
  },
  
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#2D2D2D',
    black: '#1A1A1A',
  },
  
  // Background Colors (Warm Cream Tones)
  background: {
    primary: '#FBF9F7',    // Main warm cream background
    secondary: '#FFFFFF',
    tertiary: '#F5F0EB',
    card: '#FFFFFF',
    highlight: '#FFF5F6',  // Soft rose tint
  },
  
  // Text Colors
  text: {
    primary: '#2D2D2D',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
    accent: '#E85A6B',     // Rose for highlighted text
    link: '#E85A6B',
  },
  
  // Special Colors
  emergency: '#EF5350',
  online: '#4CAF50',
  offline: '#9E9E9E',
  
  // Chat bubble colors
  chat: {
    sent: '#2D2D2D',       // Dark bubble for sent messages
    received: '#F5F0EB',   // Light cream for received
    sentText: '#FFFFFF',
    receivedText: '#2D2D2D',
  },
  
  // Tag/Badge colors
  tag: {
    dad: '#E85A6B',        // Rose for parent tags
    son: '#64B5F6',        // Blue for child tags
  },
  
  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.2)',
    medium: 'rgba(0, 0, 0, 0.4)',
    dark: 'rgba(0, 0, 0, 0.6)',
    rose: 'rgba(232, 90, 107, 0.1)',  // Soft rose overlay
  },
} as const;

export type ColorToken = keyof typeof colors;
```

---

## Typography

Using a combination of elegant serif (for headings/names) and clean sans-serif (for body text).

**Font Recommendations:**
- **Headings/Display:** Playfair Display, Libre Baskerville, or Georgia (serif)
- **Body:** SF Pro, Inter, or System default (sans-serif)
- **Italic Quotes:** Playfair Display Italic

```typescript
// src/constants/typography.ts

export const typography = {
  // Font Families
  fontFamily: {
    // Elegant serif for headings and display text
    serif: 'PlayfairDisplay',        // or 'Georgia' as fallback
    serifItalic: 'PlayfairDisplay-Italic',
    
    // Clean sans-serif for body text
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
  },
} as const;

// Pre-defined text styles
export const textStyles = {
  // Display/Hero text (Serif - for section titles like "The Vault", "The Bridge")
  display: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.tight,
  },
  
  // Greeting text (Serif - "Good Morning, Dad")
  greeting: {
    fontFamily: typography.fontFamily.serif,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Italic quote text (Serif Italic - for memories/quotes)
  quote: {
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
    fontStyle: 'italic',
  },
  
  // Highlighted name (Serif Italic - "Dad" in greeting)
  nameHighlight: {
    fontFamily: typography.fontFamily.serifItalic,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.regular,
    color: colors.primary[500],
    fontStyle: 'italic',
  },
  
  // Headings (Sans-serif)
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Body
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Labels (All caps, spaced - "DAD'S RHYTHM", "SPARK A THOUGHT")
  labelUppercase: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // Captions
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Date/Time display
  dateDisplay: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primary[500],
  },
  
  // Buttons
  buttonLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
} as const;
```

---

## Spacing

8px base unit system for consistent spacing.

```typescript
// src/constants/spacing.ts

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
  
  // Tab bar
  tabBarHeight: 80,
  
  // Header
  headerHeight: 56,
} as const;
```

---

## Border Radius

```typescript
// src/constants/borderRadius.ts

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Semantic border radius
export const radius = {
  button: borderRadius['3xl'],
  card: borderRadius.xl,
  input: borderRadius.lg,
  modal: borderRadius['2xl'],
  avatar: borderRadius.full,
  badge: borderRadius.full,
  chip: borderRadius.full,
} as const;
```

---

## Shadows

```typescript
// src/constants/shadows.ts

import { Platform, StyleSheet } from 'react-native';

export const shadows = StyleSheet.create({
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
  }) as any,
  
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }) as any,
  
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
  }) as any,
  
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
  }) as any,
});
```

---

## Icons

Using Expo Vector Icons (Ionicons + FontAwesome).

```typescript
// src/constants/icons.ts

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
export const reminderIcons = {
  medicine: 'medical',          // Ionicons
  meal: 'restaurant',           // Ionicons
  doctor: 'medkit',             // Ionicons
  exercise: 'fitness',          // Ionicons
  other: 'notifications',       // Ionicons
} as const;

// Tab bar icons
export const tabIcons = {
  home: { active: 'home', inactive: 'home-outline' },
  reminders: { active: 'alarm', inactive: 'alarm-outline' },
  chat: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  album: { active: 'images', inactive: 'images-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
} as const;

// Mood icons
export const moodIcons = {
  happy: 'happy',
  neutral: 'remove-circle',
  sad: 'sad',
  tired: 'moon',
} as const;
```

---

## Animation

```typescript
// src/constants/animation.ts

export const animation = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Easing curves
  easing: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
    spring: { damping: 15, stiffness: 150 },
  },
} as const;
```

---

## Theme Configuration

```typescript
// src/constants/theme.ts

import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, layout } from './spacing';
import { borderRadius, radius } from './borderRadius';
import { shadows } from './shadows';
import { iconSizes } from './icons';
import { animation } from './animation';

export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  layout,
  borderRadius,
  radius,
  shadows,
  iconSizes,
  animation,
} as const;

export type Theme = typeof theme;

// Hook for accessing theme
export const useTheme = () => theme;
```

---

## Component Variants

### Button Variants

```typescript
export const buttonVariants = {
  primary: {
    background: colors.primary[500],
    text: colors.neutral.white,
    border: 'transparent',
    pressedBackground: colors.primary[600],
  },
  secondary: {
    background: colors.neutral.white,
    text: colors.primary[500],
    border: colors.primary[500],
    pressedBackground: colors.primary[50],
  },
  tertiary: {
    background: 'transparent',
    text: colors.primary[500],
    border: 'transparent',
    pressedBackground: colors.primary[50],
  },
  danger: {
    background: colors.danger.main,
    text: colors.neutral.white,
    border: 'transparent',
    pressedBackground: colors.danger.dark,
  },
  emergency: {
    background: colors.emergency,
    text: colors.neutral.white,
    border: 'transparent',
    pressedBackground: colors.danger.dark,
  },
} as const;
```

### Input Variants

```typescript
export const inputVariants = {
  default: {
    background: colors.neutral.white,
    border: colors.neutral[300],
    text: colors.text.primary,
    placeholder: colors.text.tertiary,
    focusBorder: colors.primary[500],
  },
  error: {
    background: colors.neutral.white,
    border: colors.danger.main,
    text: colors.text.primary,
    placeholder: colors.text.tertiary,
    focusBorder: colors.danger.main,
  },
  disabled: {
    background: colors.neutral[100],
    border: colors.neutral[200],
    text: colors.text.tertiary,
    placeholder: colors.text.tertiary,
    focusBorder: colors.neutral[200],
  },
} as const;
```

### Card Variants

```typescript
export const cardVariants = {
  // Default card (white with subtle shadow)
  default: {
    background: colors.neutral.white,
    border: 'transparent',
    shadow: shadows.sm,
    borderRadius: radius.lg,
  },
  
  // Elevated card (more prominent shadow)
  elevated: {
    background: colors.neutral.white,
    border: 'transparent',
    shadow: shadows.md,
    borderRadius: radius.lg,
  },
  
  // Rhythm Card (activity status - "Dad's Rhythm", "Son's Rhythm")
  rhythm: {
    background: colors.neutral.white,
    border: 'transparent',
    shadow: shadows.sm,
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  
  // Spark Card (soft rose background - "Spark a Thought")
  spark: {
    background: colors.background.highlight, // Soft rose tint
    border: 'transparent',
    shadow: shadows.none,
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  
  // Greeting Card (soft rose/cream background)
  greeting: {
    background: colors.primary[50],
    border: 'transparent',
    shadow: shadows.none,
    borderRadius: radius.xl,
    padding: spacing[5],
  },
  
  // Vault/Photo Card (for album images)
  vault: {
    background: colors.neutral.white,
    border: 'transparent',
    shadow: shadows.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  
  // Tag/Badge styles
  tag: {
    dad: {
      background: 'transparent',
      border: colors.primary[500],
      text: colors.primary[500],
      borderWidth: 1,
      borderRadius: radius.full,
    },
    son: {
      background: 'transparent',
      border: colors.accent.main,
      text: colors.accent.main,
      borderWidth: 1,
      borderRadius: radius.full,
    },
  },
  
  // Reminder cards
  reminder: {
    medicine: {
      background: colors.primary[50],
      accent: colors.primary[500],
    },
    meal: {
      background: '#FFF9E6',
      accent: '#F5A623',
    },
    doctor: {
      background: colors.accent.light,
      accent: colors.accent.main,
    },
    exercise: {
      background: colors.success.light,
      accent: colors.success.main,
    },
    other: {
      background: colors.secondary[100],
      accent: colors.secondary[600],
    },
  },
} as const;
```

### Chat Bubble Variants

```typescript
export const chatBubbleVariants = {
  // Sent message (dark bubble)
  sent: {
    background: colors.chat.sent,
    text: colors.chat.sentText,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  
  // Received message (light cream bubble)
  received: {
    background: colors.chat.received,
    text: colors.chat.receivedText,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
} as const;
```

### Special UI Elements

```typescript
// Suggest Activity Button (rose outline with sparkle)
export const suggestActivityStyle = {
  background: 'transparent',
  border: colors.primary[500],
  text: colors.primary[500],
  icon: 'sparkles',
  borderWidth: 1,
  borderRadius: radius.full,
};

// View As Toggle (top right of chat)
export const viewAsToggle = {
  background: colors.secondary[100],
  text: colors.text.secondary,
  borderRadius: radius.full,
  padding: spacing[2],
};

// Date badge (rose text, uppercase)
export const dateBadge = {
  text: colors.primary[500],
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  letterSpacing: 1,
  textTransform: 'uppercase',
};

// Floating Action Button (+ button)
export const fabStyle = {
  background: colors.neutral[900],
  icon: colors.neutral.white,
  size: 56,
  borderRadius: 28,
  shadow: shadows.lg,
};
```

---

## Font Loading (Expo)

To use the serif fonts, add to your app:

```typescript
// App.tsx or _layout.tsx
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay: PlayfairDisplay_400Regular,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return null; // or splash screen
  }

  // ... rest of app
}
```

---

## Accessibility Guidelines

### Touch Targets
- Minimum touch target size: **44x44 points** (Apple HIG)
- Recommended for elderly: **56x56 points**
- Spacing between interactive elements: **8 points minimum**

### Text Sizes
- Minimum body text: **16sp**
- Labels and captions: **14sp minimum**
- Support Dynamic Type for iOS

### Contrast Ratios
- Normal text: **4.5:1 minimum** (WCAG AA)
- Large text (18sp+): **3:1 minimum**
- Interactive elements: **3:1 minimum**

### Motion
- Respect "Reduce Motion" accessibility setting
- Provide alternatives for animations
- No flashing content

### Screen Reader
- All interactive elements have accessibility labels
- Proper heading hierarchy
- Announce state changes

