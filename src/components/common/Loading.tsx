// src/components/common/Loading.tsx
// Loading indicators and skeleton screens

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, spacing, typography, radius } from '../../constants';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

/**
 * Simple loading spinner
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = colors.primary[500],
  text,
  fullScreen = false,
  style,
}) => {
  const containerStyle = fullScreen ? styles.fullScreen : styles.container;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton placeholder for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for Card components
 */
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <Skeleton width={60} height={16} />
        <Skeleton width={80} height={20} />
      </View>
      <Skeleton width="100%" height={16} style={{ marginBottom: spacing[2] }} />
      <Skeleton width="80%" height={16} style={{ marginBottom: spacing[2] }} />
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={32} borderRadius={radius.full} />
        <Skeleton width={80} height={16} />
      </View>
    </View>
  );
};

/**
 * Skeleton for Reminder Card
 */
export const ReminderCardSkeleton: React.FC = () => {
  return (
    <View style={styles.reminderCardSkeleton}>
      <View style={styles.reminderHeader}>
        <Skeleton width={80} height={24} />
        <Skeleton width={60} height={20} borderRadius={radius.full} />
      </View>
      <Skeleton width="100%" height={16} style={{ marginTop: spacing[2], marginBottom: spacing[2] }} />
      <Skeleton width="70%" height={16} style={{ marginBottom: spacing[3] }} />
      <View style={styles.reminderFooter}>
        <Skeleton width={120} height={14} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
};

/**
 * Skeleton for Home Screen Cards
 */
export const HomeCardSkeleton: React.FC = () => {
  return (
    <View style={styles.homeCardSkeleton}>
      <Skeleton width={120} height={18} style={{ marginBottom: spacing[3] }} />
      <Skeleton width="100%" height={60} style={{ marginBottom: spacing[2] }} />
      <Skeleton width="60%" height={16} />
    </View>
  );
};

/**
 * Skeleton for Chat Message Bubbles
 */
export const ChatMessageSkeleton: React.FC<{ isSent?: boolean }> = ({ isSent = false }) => {
  return (
    <View style={[styles.chatMessageSkeleton, isSent ? styles.chatMessageRight : styles.chatMessageLeft]}>
      <Skeleton 
        width={isSent ? 200 : 180} 
        height={60} 
        borderRadius={radius.lg}
        style={{ alignSelf: isSent ? 'flex-end' : 'flex-start' }}
      />
    </View>
  );
};

/**
 * Skeleton for Album Grid Items
 */
export const AlbumImageSkeleton: React.FC = () => {
  return (
    <View style={styles.albumImageSkeleton}>
      <Skeleton width="100%" height={120} borderRadius={radius.lg} />
    </View>
  );
};

/**
 * Loading list with multiple skeletons
 */
interface LoadingListProps {
  count?: number;
  type?: 'card' | 'reminder' | 'home' | 'chat' | 'album';
}

export const LoadingList: React.FC<LoadingListProps> = ({ count = 3, type = 'card' }) => {
  if (type === 'chat') {
    return (
      <View style={styles.loadingList}>
        <ChatMessageSkeleton isSent={false} />
        <ChatMessageSkeleton isSent={true} />
        <ChatMessageSkeleton isSent={false} />
        <ChatMessageSkeleton isSent={true} />
        <ChatMessageSkeleton isSent={false} />
      </View>
    );
  }

  if (type === 'album') {
    return (
      <View style={styles.albumGrid}>
        {Array.from({ length: count }).map((_, index) => (
          <AlbumImageSkeleton key={index} />
        ))}
      </View>
    );
  }

  const SkeletonComponent = 
    type === 'reminder' ? ReminderCardSkeleton :
    type === 'home' ? HomeCardSkeleton :
    CardSkeleton;

  return (
    <View style={styles.loadingList}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  container: {
    padding: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  skeleton: {
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  cardSkeleton: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  reminderCardSkeleton: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeCardSkeleton: {
    backgroundColor: colors.neutral.white,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  loadingList: {
    padding: spacing[4],
  },
  chatMessageSkeleton: {
    marginVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  chatMessageLeft: {
    alignItems: 'flex-start',
  },
  chatMessageRight: {
    alignItems: 'flex-end',
  },
  albumImageSkeleton: {
    flex: 1,
    margin: spacing[1],
    minWidth: '30%',
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing[2],
  },
});
