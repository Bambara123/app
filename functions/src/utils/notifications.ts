/**
 * Push notification utility using Expo Server SDK
 */

import Expo, {ExpoPushMessage, ExpoPushTicket} from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single device
 * @param {string} pushToken - Expo push token for the device
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {Record<string, unknown>} data - Optional data payload
 * @param {string} sound - Sound to play (default, or custom sound name)
 * @return {Promise<boolean>} Success status
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
  sound = "default"
): Promise<boolean> {
  // Validate token format
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return false;
  }

  // Build the message
  const message: ExpoPushMessage = {
    to: pushToken,
    sound: sound as ExpoPushMessage["sound"],
    title,
    body,
    data: data || {},
    priority: "high",
    channelId: "reminders", // Android-specific (not used - iOS-only app)
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    // Check for errors in tickets
    for (const ticket of tickets) {
      if (ticket.status === "error") {
        console.error("Push notification error:", ticket.message);
        if (ticket.details?.error === "DeviceNotRegistered") {
          // Token is invalid, should be removed from database
          console.log("Device not registered, token should be removed");
        }
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

/**
 * Send the actual reminder notification (rings at reminder time)
 * @param {string} pushToken - Expo push token for the device
 * @param {string} reminderId - Reminder document ID
 * @param {string} reminderTitle - Reminder title
 * @param {string} reminderDescription - Reminder description
 * @return {Promise<boolean>} Success status
 */
export async function sendReminderNotification(
  pushToken: string,
  reminderId: string,
  reminderTitle: string,
  reminderDescription: string
): Promise<boolean> {
  return sendPushNotification(
    pushToken,
    reminderTitle,
    reminderDescription || "Time for your reminder!",
    {
      type: "reminder",
      reminderId,
    },
    "reminder.aac" // Custom alarm sound
  );
}

/**
 * Send sync push notification to schedule a reminder on the device
 * This wakes up the app so it can schedule the local notification
 * @param {string} pushToken - Expo push token for the device
 * @param {string} reminderId - Reminder document ID
 * @param {string} reminderTitle - Reminder title
 * @param {string} reminderDescription - Reminder description
 * @param {Date} reminderDateTime - When the reminder should fire
 * @return {Promise<boolean>} Success status
 */
export async function sendReminderSyncNotification(
  pushToken: string,
  reminderId: string,
  reminderTitle: string,
  reminderDescription: string,
  reminderDateTime: Date
): Promise<boolean> {
  return sendPushNotification(
    pushToken,
    "New Reminder",
    `"${reminderTitle}" has been scheduled for you.`,
    {
      type: "reminder_sync",
      reminderId,
      reminderTitle,
      reminderDescription,
      reminderDateTime: reminderDateTime.toISOString(),
    }
  );
}
