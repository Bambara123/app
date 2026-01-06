// src/services/notifications.ts
// Expo Notifications service

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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

// Request permissions and get push token
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
      return null;
    }

    // Get Expo push token - requires EAS project ID
    // Skip in development if not configured
    const projectId = process.env.EXPO_PUBLIC_EXPO_PROJECT_ID;
    if (!projectId) {
      console.log('Skipping push token registration - no Expo project ID configured');
      console.log('Push notifications will work with local notifications only');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E85A6B',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 500, 500],
      });

      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 1000, 500, 1000],
        lightColor: '#EF5350',
      });
    }

    return tokenData.data;
  } catch (error) {
    console.log('Push notification registration failed:', error);
    console.log('App will continue without push notifications');
    return null;
  }
};

// Schedule local notification for reminder
export const scheduleReminderNotification = async (
  reminderId: string,
  title: string,
  body: string,
  triggerDate: Date
): Promise<string> => {
  // Check if the trigger date is in the past
  const now = new Date();
  if (triggerDate <= now) {
    // If in the past, schedule for 1 second from now
    triggerDate = new Date(now.getTime() + 1000);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'reminder', reminderId } as Record<string, unknown>,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    },
  });

  return identifier;
};

// Cancel scheduled notification
export const cancelNotification = async (
  notificationId: string
): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Setup notification response listener
export const setupNotificationListeners = (): () => void => {
  // Handle notification received while app is foregrounded
  // For reminders, automatically open the alarm modal
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      const data = notification.request.content.data as unknown as NotificationData;
      
      // Auto-open full screen alarm for reminder notifications
      if (data?.type === 'reminder' && data.reminderId) {
        // Small delay to ensure app is ready
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
    Notifications.addNotificationResponseReceivedListener((response) => {
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

// Send local notification immediately (for testing)
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
      sound: true,
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

