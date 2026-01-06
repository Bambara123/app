# Component Library

Reusable UI components for ElderCare application.

---

## Component Organization

```
src/components/
├── common/              # Shared base components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── SearchBar.tsx          # NEW: Search input with filters
│   ├── LoadingSpinner.tsx
│   └── SafeAreaWrapper.tsx
├── chat/                # Chat-specific components
│   ├── ChatBubble.tsx
│   ├── ChatHeader.tsx         # NEW: Header with call buttons
│   ├── CallButtons.tsx        # NEW: WhatsApp + Normal call
│   ├── MessageInput.tsx
│   ├── VoiceRecorder.tsx
│   ├── StickerPicker.tsx
│   └── ImagePicker.tsx
├── reminders/           # Reminder components
│   ├── ReminderCard.tsx
│   ├── ReminderForm.tsx
│   ├── ReminderAlarm.tsx
│   ├── ReminderFilters.tsx    # NEW: Filter chips for reminders
│   ├── LabelPicker.tsx
│   └── RepeatPicker.tsx
├── album/               # Photo album components
│   ├── PhotoCard.tsx
│   ├── PhotoWall.tsx
│   └── ImageUploader.tsx
├── home/                # Home screen components
│   ├── EmergencyButton.tsx      # Large standalone (kept for flexibility)
│   ├── EmergencyButtonCompact.tsx  # NEW: Compact version for status row
│   ├── BatteryCard.tsx          # NEW: Battery display card
│   ├── PartnerNoteCard.tsx      # NEW: Note from partner display
│   ├── StatusCard.tsx
│   ├── MoodSelector.tsx
│   └── ParentLocationMap.tsx
└── settings/            # Settings components
    ├── SettingsItem.tsx
    ├── ProfileEditor.tsx
    └── PartnerConnection.tsx
```

---

## Common Components

### Button

Large, accessible buttons with haptic feedback.

```typescript
// src/components/common/Button.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'emergency';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  haptic = true,
}) => {
  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(
        variant === 'emergency' 
          ? Haptics.ImpactFeedbackStyle.Heavy 
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor(variant)} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
    gap: spacing[2],
  },
  // Variants
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  tertiary: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger.main,
  },
  emergency: {
    backgroundColor: colors.emergency,
  },
  // Sizes
  size_sm: {
    height: 40,
    paddingHorizontal: spacing[4],
  },
  size_md: {
    height: 52,
    paddingHorizontal: spacing[6],
  },
  size_lg: {
    height: 60,
    paddingHorizontal: spacing[8],
  },
  // Text styles
  text: {
    ...textStyles.button,
  },
  text_primary: {
    color: colors.neutral.white,
  },
  text_secondary: {
    color: colors.primary[500],
  },
  text_tertiary: {
    color: colors.primary[500],
  },
  text_danger: {
    color: colors.neutral.white,
  },
  text_emergency: {
    color: colors.neutral.white,
  },
  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

### Card

```typescript
// src/components/common/Card.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, shadows } from '@/constants/theme';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  elevated: {
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
});
```

---

### Input

```typescript
// src/components/common/Input.tsx

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, textStyles, layout } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.danger.main
    : isFocused
    ? colors.primary[500]
    : colors.neutral[300];

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, { borderColor }]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...textStyles.label,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderWidth: 2,
    borderRadius: radius.input,
    height: layout.inputHeight,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing[4],
    ...textStyles.body,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing[2],
  },
  inputWithRightIcon: {
    paddingRight: spacing[2],
  },
  iconLeft: {
    paddingLeft: spacing[4],
  },
  iconRight: {
    paddingRight: spacing[4],
  },
  helperText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  errorText: {
    color: colors.danger.main,
  },
});
```

---

### Avatar

```typescript
// src/components/common/Avatar.tsx

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
  batteryLevel?: number;
  isOnline?: boolean;
  style?: ViewStyle;
}

const sizes = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  showBadge = false,
  badgeContent,
  batteryLevel,
  isOnline,
  style,
}) => {
  const dimension = sizes[size];
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[{ width: dimension, height: dimension }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          {initials ? (
            <Text style={[styles.initials, { fontSize: dimension * 0.4 }]}>
              {initials}
            </Text>
          ) : (
            <Ionicons
              name="person"
              size={dimension * 0.5}
              color={colors.neutral[400]}
            />
          )}
        </View>
      )}
      
      {/* Online indicator */}
      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            { backgroundColor: isOnline ? colors.online : colors.offline },
          ]}
        />
      )}
      
      {/* Battery badge */}
      {batteryLevel !== undefined && (
        <View style={styles.batteryBadge}>
          <Ionicons
            name={getBatteryIcon(batteryLevel)}
            size={12}
            color={getBatteryColor(batteryLevel)}
          />
          <Text style={styles.batteryText}>{batteryLevel}%</Text>
        </View>
      )}
      
      {/* Custom badge */}
      {showBadge && badgeContent && (
        <View style={styles.badge}>{badgeContent}</View>
      )}
    </View>
  );
};

const getBatteryIcon = (level: number) => {
  if (level > 80) return 'battery-full';
  if (level > 50) return 'battery-half';
  if (level > 20) return 'battery-low';
  return 'battery-dead';
};

const getBatteryColor = (level: number) => {
  if (level > 50) return colors.success.main;
  if (level > 20) return colors.warning.main;
  return colors.danger.main;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.neutral[200],
  },
  placeholder: {
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    color: colors.neutral[600],
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  batteryBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radius.badge,
    gap: 2,
  },
  batteryText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
});
```

---

## Reminder Components

### ReminderCard

```typescript
// src/components/reminders/ReminderCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Reminder, REMINDER_LABELS } from '@/types';
import { colors, spacing, radius, textStyles, shadows } from '@/constants/theme';

interface ReminderCardProps {
  reminder: Reminder;
  onPress?: () => void;
  onDone?: () => void;
  onSnooze?: () => void;
  showActions?: boolean;
  isParent?: boolean;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onPress,
  onDone,
  onSnooze,
  showActions = false,
  isParent = false,
}) => {
  const labelConfig = REMINDER_LABELS[reminder.label];
  const isPending = reminder.status === 'pending';
  const isDone = reminder.status === 'done';
  const isMissed = reminder.status === 'missed';

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDone?.();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(reminder.label) },
        isDone && styles.completed,
        isMissed && styles.missed,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: labelConfig.color }]}>
        <Ionicons
          name={labelConfig.icon as any}
          size={24}
          color={colors.neutral.white}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, isDone && styles.titleCompleted]}>
          {reminder.title}
        </Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.time}>
            {format(reminder.dateTime, 'h:mm a')}
          </Text>
          {reminder.repeat !== 'none' && (
            <>
              <Ionicons name="repeat" size={14} color={colors.text.tertiary} />
              <Text style={styles.repeat}>{reminder.repeat}</Text>
            </>
          )}
        </View>
      </View>

      {/* Status/Actions */}
      <View style={styles.statusContainer}>
        {isDone && (
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
          </View>
        )}
        {isMissed && (
          <View style={styles.statusBadge}>
            <Ionicons name="close-circle" size={24} color={colors.danger.main} />
          </View>
        )}
        {showActions && isPending && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={onSnooze} style={styles.actionButton}>
              <Ionicons name="time" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <Ionicons name="checkmark" size={20} color={colors.neutral.white} />
            </TouchableOpacity>
          </View>
        )}
        {!showActions && !isDone && !isMissed && !isParent && (
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const getBackgroundColor = (label: string) => {
  const backgrounds: Record<string, string> = {
    medicine: '#FFF5F5',
    meal: '#FFF9E6',
    doctor: '#E8F4F7',
    exercise: '#E8F8EF',
    other: colors.neutral[50],
  };
  return backgrounds[label] || colors.neutral[50];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.card,
    gap: spacing[3],
    ...shadows.sm,
  },
  completed: {
    opacity: 0.7,
  },
  missed: {
    borderWidth: 1,
    borderColor: colors.danger.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing[1],
  },
  title: {
    ...textStyles.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  time: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  repeat: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {},
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

## Home Components

### EmergencyButton

Large, prominent emergency button with haptic feedback.

```typescript
// src/components/home/EmergencyButton.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, textStyles } from '@/constants/theme';

interface EmergencyButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onPress,
  isLoading = false,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Continuous pulse animation
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert? Your child will be notified immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onPress();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.1],
              outputRange: [0.3, 0],
            }),
          },
        ]}
      />

      {/* Main button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
          style={styles.button}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Emergency button. Double tap to send emergency alert to your child."
          accessibilityHint="Sends an immediate notification with your location"
        >
          <Ionicons
            name="alert-circle"
            size={64}
            color={colors.neutral.white}
          />
          <Text style={styles.buttonText}>EMERGENCY</Text>
          <Text style={styles.subText}>Tap for help</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.description}>
        Press this button only in case of emergency.{'\n'}
        Your child will be notified immediately.
      </Text>
    </View>
  );
};

const BUTTON_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    backgroundColor: colors.emergency,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonText: {
    ...textStyles.h3,
    color: colors.neutral.white,
    marginTop: spacing[2],
  },
  subText: {
    ...textStyles.bodySmall,
    color: colors.neutral.white,
    opacity: 0.8,
  },
  description: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[6],
    lineHeight: 20,
  },
});
```

---

## Chat Components

### ChatBubble

```typescript
// src/components/chat/ChatBubble.tsx

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Message } from '@/types';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  showTime?: boolean;
  onImagePress?: (url: string) => void;
  onVoicePress?: (url: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  showTime = true,
  onImagePress,
  onVoicePress,
}) => {
  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <Text style={[styles.text, isOwn && styles.textOwn]}>{message.content}</Text>;
      
      case 'image':
        return (
          <TouchableOpacity onPress={() => onImagePress?.(message.content)}>
            <Image
              source={{ uri: message.thumbnailUrl || message.content }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      
      case 'voice':
        return (
          <TouchableOpacity
            onPress={() => onVoicePress?.(message.content)}
            style={styles.voiceContainer}
          >
            <Ionicons
              name="play-circle"
              size={32}
              color={isOwn ? colors.neutral.white : colors.primary[500]}
            />
            <View style={styles.voiceWave}>
              {/* Waveform visualization placeholder */}
              {[...Array(10)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: Math.random() * 16 + 8,
                      backgroundColor: isOwn ? colors.neutral.white : colors.primary[300],
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.voiceDuration, isOwn && styles.textOwn]}>
              {formatDuration(message.voiceDuration || 0)}
            </Text>
          </TouchableOpacity>
        );
      
      case 'sticker':
        const [packId, stickerId] = message.content.split(':');
        return (
          <Image
            source={{ uri: getStickerUrl(packId, stickerId) }}
            style={styles.sticker}
            resizeMode="contain"
          />
        );
      
      default:
        return <Text style={styles.text}>{message.content}</Text>;
    }
  };

  const isSticker = message.type === 'sticker';

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          isSticker && styles.bubbleSticker,
        ]}
      >
        {renderContent()}
      </View>
      {showTime && (
        <Text style={[styles.time, isOwn && styles.timeOwn]}>
          {format(message.timestamp, 'h:mm a')}
          {isOwn && message.read && (
            <Ionicons name="checkmark-done" size={12} color={colors.primary[500]} />
          )}
        </Text>
      )}
    </View>
  );
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getStickerUrl = (packId: string, stickerId: string) => {
  // Return sticker URL from assets or CDN
  return `https://your-cdn.com/stickers/${packId}/${stickerId}.png`;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[1],
    alignItems: 'flex-start',
  },
  containerOwn: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  bubbleSticker: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  text: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  textOwn: {
    color: colors.neutral.white,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
  },
  sticker: {
    width: 120,
    height: 120,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    minWidth: 150,
  },
  voiceWave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  time: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  timeOwn: {
    textAlign: 'right',
  },
});
```

---

## Album Components

### PhotoWall

Masonry-style photo grid for the shared album.

```typescript
// src/components/album/PhotoWall.tsx

import React, { useCallback } from 'react';
import {
  View,
  Image,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import { AlbumImage, AlbumSection } from '@/types';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GAP = spacing[2];
const ITEM_WIDTH = (width - spacing[4] * 2 - GAP) / COLUMN_COUNT;

interface PhotoWallProps {
  sections: AlbumSection[];
  onImagePress: (image: AlbumImage) => void;
  onEndReached?: () => void;
  ListHeaderComponent?: React.ReactElement;
}

export const PhotoWall: React.FC<PhotoWallProps> = ({
  sections,
  onImagePress,
  onEndReached,
  ListHeaderComponent,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: AlbumImage }) => (
      <TouchableOpacity
        onPress={() => onImagePress(item)}
        style={styles.imageContainer}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={[
            styles.image,
            { height: getImageHeight(item.width, item.height) },
          ]}
          resizeMode="cover"
        />
        {item.note && (
          <View style={styles.noteOverlay}>
            <Text style={styles.noteText} numberOfLines={2}>
              {item.note}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [onImagePress]
  );

  const renderSectionHeader = ({ section }: { section: AlbumSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  // Flatten sections for FlatList with headers
  const flatData = sections.reduce<(AlbumImage | { type: 'header'; title: string })[]>(
    (acc, section) => {
      acc.push({ type: 'header', title: section.title });
      acc.push(...section.data);
      return acc;
    },
    []
  );

  return (
    <FlatList
      data={flatData}
      renderItem={({ item }) =>
        'type' in item && item.type === 'header' ? (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        ) : (
          renderItem({ item: item as AlbumImage })
        )
      }
      keyExtractor={(item, index) =>
        'type' in item ? `header-${item.title}` : item.id
      }
      numColumns={COLUMN_COUNT}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const getImageHeight = (width: number, height: number) => {
  const aspectRatio = height / width;
  return Math.min(Math.max(ITEM_WIDTH * aspectRatio, 120), 250);
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  sectionHeader: {
    width: '100%',
    paddingVertical: spacing[3],
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    backgroundColor: colors.neutral[200],
  },
  noteOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[2],
    backgroundColor: colors.overlay.medium,
  },
  noteText: {
    ...textStyles.caption,
    color: colors.neutral.white,
  },
});
```

---

## New Components (Based on Wireframes)

### ChatHeader with Call Buttons

Header for chat screen with WhatsApp and normal call options.

```typescript
// src/components/chat/ChatHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/common';
import { colors, spacing, textStyles } from '@/constants/theme';

interface ChatHeaderProps {
  partnerName: string;
  partnerAvatar?: string | null;
  partnerPhone?: string | null;
  isOnline?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partnerName,
  partnerAvatar,
  partnerPhone,
  isOnline,
}) => {
  const handleWhatsAppCall = () => {
    if (partnerPhone) {
      const url = `whatsapp://call?number=${partnerPhone.replace(/[^0-9]/g, '')}`;
      Linking.openURL(url).catch(() => {
        // WhatsApp not installed
        alert('WhatsApp is not installed');
      });
    }
  };

  const handleNormalCall = () => {
    if (partnerPhone) {
      Linking.openURL(`tel:${partnerPhone}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Avatar
          source={partnerAvatar}
          name={partnerName}
          size="md"
          isOnline={isOnline}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{partnerName}</Text>
          <Text style={styles.status}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Call Buttons */}
      <View style={styles.callButtons}>
        <TouchableOpacity
          onPress={handleWhatsAppCall}
          style={[styles.callButton, styles.whatsappButton]}
          disabled={!partnerPhone}
        >
          <Ionicons name="logo-whatsapp" size={20} color={colors.neutral.white} />
          <Text style={styles.callButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNormalCall}
          style={[styles.callButton, styles.normalCallButton]}
          disabled={!partnerPhone}
        >
          <Ionicons name="call" size={20} color={colors.neutral.white} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  nameContainer: {
    marginLeft: spacing[3],
  },
  name: {
    ...textStyles.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  status: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  callButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: 8,
    gap: spacing[2],
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  normalCallButton: {
    backgroundColor: colors.primary[500],
  },
  callButtonText: {
    ...textStyles.label,
    color: colors.neutral.white,
  },
});
```

---

### ReminderFilters

Filter chips and search bar for reminders list.

```typescript
// src/components/reminders/ReminderFilters.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

type FilterLabel = 'all' | 'medicine' | 'meal' | 'doctor' | 'exercise' | 'other';
type FilterStatus = 'all' | 'pending' | 'done' | 'missed';

interface ReminderFiltersProps {
  onSearch: (query: string) => void;
  onLabelFilter: (label: FilterLabel) => void;
  onStatusFilter: (status: FilterStatus) => void;
  selectedLabel: FilterLabel;
  selectedStatus: FilterStatus;
}

const labelFilters: { id: FilterLabel; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'medicine', label: 'Medicine', icon: 'medical' },
  { id: 'meal', label: 'Meal', icon: 'restaurant' },
  { id: 'doctor', label: 'Doctor', icon: 'medkit' },
  { id: 'exercise', label: 'Exercise', icon: 'fitness' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export const ReminderFilters: React.FC<ReminderFiltersProps> = ({
  onSearch,
  onLabelFilter,
  onStatusFilter,
  selectedLabel,
  selectedStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch(text);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reminders..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {labelFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onLabelFilter(filter.id)}
            style={[
              styles.filterChip,
              selectedLabel === filter.id && styles.filterChipActive,
            ]}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={selectedLabel === filter.id ? colors.neutral.white : colors.text.secondary}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedLabel === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingVertical: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    marginHorizontal: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing[3],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing[2],
    ...textStyles.body,
    color: colors.text.primary,
  },
  filtersScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    gap: spacing[1],
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterChipText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.neutral.white,
  },
});
```

---

### BatteryCard

Compact battery display card for home screens.

```typescript
// src/components/home/BatteryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

interface BatteryCardProps {
  level: number;  // 0-100
  label: string;
}

export const BatteryCard: React.FC<BatteryCardProps> = ({ level, label }) => {
  const getBatteryIcon = () => {
    if (level > 80) return 'battery-full';
    if (level > 50) return 'battery-half';
    if (level > 20) return 'battery-low';
    return 'battery-dead';
  };

  const getBatteryColor = () => {
    if (level > 50) return colors.success.main;
    if (level > 20) return colors.warning.main;
    return colors.danger.main;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.batteryRow}>
        <Ionicons
          name={getBatteryIcon()}
          size={32}
          color={getBatteryColor()}
        />
        <Text style={[styles.percentage, { color: getBatteryColor() }]}>
          {level}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    padding: spacing[3],
    alignItems: 'center',
  },
  label: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  percentage: {
    ...textStyles.h4,
    fontWeight: '700',
  },
});
```

---

### EmergencyButtonCompact

Compact emergency button for the status row (Parent home).

```typescript
// src/components/home/EmergencyButtonCompact.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, textStyles } from '@/constants/theme';

interface EmergencyButtonCompactProps {
  onPress: () => void;
  isLoading?: boolean;
}

export const EmergencyButtonCompact: React.FC<EmergencyButtonCompactProps> = ({
  onPress,
  isLoading = false,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'Emergency Alert',
      'Send emergency alert to your family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onPress();
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={styles.container}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Emergency button"
    >
      {isLoading ? (
        <ActivityIndicator color={colors.neutral.white} />
      ) : (
        <>
          <Ionicons name="alert-circle" size={32} color={colors.neutral.white} />
          <Text style={styles.label}>Emergency</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.emergency,
    borderRadius: radius.lg,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  label: {
    ...textStyles.label,
    color: colors.neutral.white,
    marginTop: spacing[1],
  },
});
```

---

### ParentLocationMap

Google Maps component showing parent's location.

```typescript
// src/components/home/ParentLocationMap.tsx

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Location } from '@/types';
import { colors, spacing, textStyles } from '@/constants/theme';

interface ParentLocationMapProps {
  location: Location | null;
  parentName: string;
}

export const ParentLocationMap: React.FC<ParentLocationMapProps> = ({
  location,
  parentName,
}) => {
  if (!location) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="location-outline" size={48} color={colors.text.tertiary} />
        <Text style={styles.placeholderText}>
          Location not available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={parentName}
          description={location.address || 'Current location'}
        >
          <View style={styles.markerContainer}>
            <Ionicons name="person" size={20} color={colors.neutral.white} />
          </View>
        </Marker>
      </MapView>

      {/* Address overlay */}
      {location.address && (
        <View style={styles.addressOverlay}>
          <Ionicons name="location" size={16} color={colors.primary[500]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {location.address}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    minHeight: 200,
  },
  placeholder: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },
  placeholderText: {
    ...textStyles.body,
    color: colors.text.tertiary,
    marginTop: spacing[2],
  },
  markerContainer: {
    backgroundColor: colors.primary[500],
    padding: spacing[2],
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.neutral.white,
  },
  addressOverlay: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    right: spacing[3],
    backgroundColor: colors.neutral.white,
    padding: spacing[2],
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
});
```

---

## Usage Guidelines

### Component Import Pattern

```typescript
// Import from component index files
import { Button, Card, Input, Avatar, SearchBar } from '@/components/common';
import { ReminderCard, ReminderForm, ReminderFilters } from '@/components/reminders';
import { ChatBubble, ChatHeader, MessageInput } from '@/components/chat';
import { PhotoWall } from '@/components/album';
import { 
  EmergencyButton, 
  EmergencyButtonCompact, 
  BatteryCard, 
  ParentLocationMap 
} from '@/components/home';
```

### Accessibility Requirements

1. All interactive components must have `accessibilityRole` and `accessibilityLabel`
2. Touch targets must be at least 44x44 points (56x56 recommended for elderly)
3. Support Dynamic Type for iOS
4. Test with VoiceOver and TalkBack
5. Provide haptic feedback for important actions

