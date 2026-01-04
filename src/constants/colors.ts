// src/constants/colors.ts
// ElderCare Color System - Warm Rose Theme

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
    parent: '#E85A6B',     // Rose for parent tags
    child: '#64B5F6',      // Blue for child tags
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

