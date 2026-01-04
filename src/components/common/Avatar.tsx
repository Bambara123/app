// src/components/common/Avatar.tsx
// Avatar component with online indicator

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, layout } from '../../constants';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: layout.avatarSm,
  md: layout.avatarMd,
  lg: layout.avatarLg,
  xl: layout.avatarXl,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  isOnline,
  style,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

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
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: isOnline ? colors.online : colors.offline,
              width: dimension * 0.3,
              height: dimension * 0.3,
              borderRadius: (dimension * 0.3) / 2,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
});

