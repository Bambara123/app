// src/services/notifications.ts
// Cloud-only notification system
// Push notifications are sent from Firebase Cloud Functions
// This service handles receiving push notifications and navigation

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { NotificationData } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// ANDROID-SPECIFIC CODE (iOS-only app)
// Note: This code is included for Android compatibility but will not be used
// as the app is only published to the Apple App Store.
// ============================================

// Configure Android notification channels (required for push notifications)
const configureAndroidChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E85A6B',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'reminder.aac',
        vibrationPattern: [0, 500, 500, 500],
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'reminder.aac',
        vibrationPattern: [0, 1000, 500, 1000],
        lightColor: '#EF5350',
        enableVibrate: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    } catch (error) {
      console.log('Failed to configure Android notification channels:', error);
    }
  }
};

// Request permissions and get push token
// This is the ONLY notification setup needed - Cloud Functions send all notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      await configureAndroidChannels();
      return null;
    }

    // Configure Android channels
    await configureAndroidChannels();

    // Get Expo push token - required for cloud notifications
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    
    if (!projectId) {
      console.log('No Expo project ID - push notifications will not work');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      console.log('Push token registered:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.log('Push token registration failed:', error);
      return null;
    }
  } catch (error) {
    console.log('Push notification registration failed:', error);
    return null;
  }
};

// Setup notification response listener
// Handles navigation when push notifications arrive or are tapped
export const setupNotificationListeners = (): () => void => {
  // Handle notification received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    async (notification) => {
      console.log('Push notification received:', notification);
      const data = notification.request.content.data as unknown as NotificationData;

      // Handle reminder notification - open alarm screen
      if (data?.type === 'reminder' && data.reminderId) {
        setTimeout(() => {
          router.push({
            pathname: '/modals/reminder-alarm',
            params: { reminderId: data.reminderId },
          });
        }, 500);
      }

      // Auto-open emergency alert
      if (data?.type === 'emergency' && data.alertId) {
        setTimeout(() => {
          router.push({
            pathname: '/modals/emergency-alert',
            params: { alertId: data.alertId },
          });
        }, 500);
      }
    }
  );

  // Handle notification tap (when user taps the notification)
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as unknown as NotificationData;
      handleNotificationTap(data);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

// Handle notification tap navigation
const handleNotificationTap = (data: NotificationData): void => {
  switch (data.type) {
    case 'reminder':
      if (data.reminderId) {
        router.push({
          pathname: '/modals/reminder-alarm',
          params: { reminderId: data.reminderId },
        });
      }
      break;

    case 'emergency':
      if (data.alertId) {
        router.push({
          pathname: '/modals/emergency-alert',
          params: { alertId: data.alertId },
        });
      }
      break;

    case 'chat_message':
      // Navigate to chat screen - handled by tab navigation
      break;

    default:
      break;
  }
};

// Send local notification immediately (for informational alerts only)
// Used for: task completed, escalation received, etc.
export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data as Record<string, unknown> | undefined,
      sound: true, // Default sound for informational notifications
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'ios' && {
        interruptionLevel: 'timeSensitive' as const,
      }),
    },
    trigger: null, // Send immediately
  });
};

// Get badge count
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

// Set badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

