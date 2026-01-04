// src/components/album/VaultCard.tsx
// Photo card for the vault/album

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { format } from 'date-fns';
import { Badge } from '../common';
import { colors, spacing, radius, typography } from '../../constants';
import { AlbumImage } from '../../types';

interface VaultCardProps {
  image: AlbumImage;
  uploaderName: string;
  uploaderRole: 'parent' | 'child';
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing[4] * 2;

export const VaultCard: React.FC<VaultCardProps> = ({
  image,
  uploaderName,
  uploaderRole,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      {/* Image */}
      <Image
        source={{ uri: image.thumbnailUrl || image.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Info overlay */}
      <View style={styles.infoContainer}>
        <Badge
          text={uploaderName}
          variant={uploaderRole === 'parent' ? 'parent' : 'child'}
        />
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {format(image.createdAt, 'MMM yyyy')}
          </Text>
        </View>
      </View>

      {/* Note */}
      {image.note && (
        <View style={styles.noteContainer}>
          <Text style={styles.note} numberOfLines={3}>
            "{image.note}"
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: colors.neutral.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: colors.neutral[200],
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  noteContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  note: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 26,
  },
});

