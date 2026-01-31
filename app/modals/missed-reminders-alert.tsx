// app/modals/missed-reminders-alert.tsx
// Alert modal for missed reminders

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/common';
import { useAuthStore, useUserStore } from '../../src/stores';
import { colors, spacing, typography } from '../../src/constants';

export default function MissedRemindersAlertScreen() {
  const { count } = useLocalSearchParams<{ count?: string }>();
  const { user } = useAuthStore();
  const { profile } = useUserStore();
  const missedCount = count ? parseInt(count, 10) : 1;
  const [partnerName, setPartnerName] = useState<string>('your loved one');

  // Fetch parent's profile to get their partnerCallName
  useEffect(() => {
    const fetchPartnerName = async () => {
      if (profile?.connectedTo) {
        try {
          const { userService } = await import('../../src/services/firebase/firestore');
          const parentProfile = await userService.getUser(profile.connectedTo);
          if (parentProfile?.partnerCallName) {
            setPartnerName(parentProfile.partnerCallName);
          }
        } catch (error) {
          console.error('Failed to fetch partner name:', error);
        }
      }
    };
    fetchPartnerName();
  }, [profile?.connectedTo]);

  // Reset missedReminders counter in Firestore
  const resetMissedReminders = async () => {
    if (user?.id) {
      try {
        const { userService } = await import('../../src/services/firebase/firestore');
        await userService.resetMissedReminders(user.id);
      } catch (error) {
        console.error('Failed to reset missed reminders:', error);
      }
    }
  };

  const handleCheck = async () => {
    router.back();
    // Navigate to reminders tab
    // The router will automatically go to the parent's reminders tab
    setTimeout(() => {
      router.push('/(parent)/reminders');
    }, 100);
  };

  const handleDismiss = async () => {
    // Reset counter when user dismisses
    await resetMissedReminders();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="heart-dislike"
            size={64}
            color={colors.warning.main}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {missedCount} Reminder{missedCount > 1 ? 's' : ''} from {partnerName}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          Please check on them. 💙
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Check on Them"
            onPress={handleCheck}
            variant="primary"
            size="lg"
            fullWidth
            style={{ backgroundColor: colors.warning.main }}
          />
          <Button
            title="Dismiss"
            onPress={handleDismiss}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: `${colors.warning.light}20`,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.warning.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 36,
  },
  message: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing[8],
  },
  actions: {
    width: '100%',
    gap: spacing[3],
  },
});
