# Firebase Cloud Functions

Server-side functions for ElderCare application.

---

## Overview

Cloud Functions handle:
1. **Emergency Alerts** - Send instant push notifications
2. **Reminder Notifications** - Notify child of completed/missed reminders
3. **Data Cleanup** - Remove old location data
4. **Push Token Management** - Handle device token updates

---

## Project Setup

### Directory Structure

```
functions/
├── src/
│   ├── index.ts           # Main exports
│   ├── emergency.ts       # Emergency alert functions
│   ├── reminders.ts       # Reminder notifications
│   ├── cleanup.ts         # Scheduled cleanup
│   └── utils/
│       ├── notifications.ts
│       └── firestore.ts
├── package.json
├── tsconfig.json
└── .eslintrc.js
```

### Package.json

```json
{
  "name": "eldercare-functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0",
    "expo-server-sdk": "^3.7.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.2.0"
  },
  "private": true
}
```

### TypeScript Configuration

```json
// functions/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

---

## Main Index File

```typescript
// functions/src/index.ts

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export { onEmergencyAlertCreated } from './emergency';
export { 
  onReminderCompleted, 
  onReminderMissed,
  checkMissedReminders 
} from './reminders';
export { cleanupOldLocations, cleanupOldAlerts } from './cleanup';
```

---

## Emergency Alert Functions

```typescript
// functions/src/emergency.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendPushNotification } from './utils/notifications';

const db = admin.firestore();

interface EmergencyAlert {
  triggeredBy: string;
  notifyUser: string;
  location: {
    latitude: number;
    longitude: number;
    address: string | null;
  } | null;
  status: string;
  createdAt: admin.firestore.Timestamp;
}

/**
 * Triggered when a new emergency alert is created.
 * Sends an immediate high-priority push notification to the child.
 */
export const onEmergencyAlertCreated = functions.firestore
  .document('emergencyAlerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    const alert = snapshot.data() as EmergencyAlert;
    const alertId = context.params.alertId;

    try {
      // Get the child user (to notify)
      const childDoc = await db.collection('users').doc(alert.notifyUser).get();
      
      if (!childDoc.exists) {
        console.error('Child user not found:', alert.notifyUser);
        return;
      }

      const child = childDoc.data();
      const expoPushToken = child?.expoPushToken;

      if (!expoPushToken) {
        console.error('No push token for child:', alert.notifyUser);
        return;
      }

      // Get parent name
      const parentDoc = await db.collection('users').doc(alert.triggeredBy).get();
      const parentName = parentDoc.data()?.name || 'Your parent';

      // Build notification content
      let body = `${parentName} needs help!`;
      if (alert.location?.address) {
        body += ` Location: ${alert.location.address}`;
      }

      // Send high-priority push notification
      await sendPushNotification({
        to: expoPushToken,
        title: '🚨 EMERGENCY ALERT',
        body,
        data: {
          type: 'emergency',
          alertId,
          triggeredBy: alert.triggeredBy,
          latitude: alert.location?.latitude?.toString() || '',
          longitude: alert.location?.longitude?.toString() || '',
        },
        priority: 'high',
        sound: 'default',
        badge: 1,
        channelId: 'emergency',
      });

      console.log('Emergency notification sent to:', alert.notifyUser);
    } catch (error) {
      console.error('Error sending emergency notification:', error);
      throw error;
    }
  });
```

---

## Reminder Functions

```typescript
// functions/src/reminders.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendPushNotification } from './utils/notifications';

const db = admin.firestore();

interface Reminder {
  id: string;
  createdBy: string;
  forUser: string;
  title: string;
  status: string;
  dateTime: admin.firestore.Timestamp;
  snoozeCount: number;
}

/**
 * Triggered when a reminder status is updated to 'done'.
 * Notifies the adult child that the parent completed the task.
 */
export const onReminderCompleted = functions.firestore
  .document('reminders/{reminderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Reminder;
    const after = change.after.data() as Reminder;
    const reminderId = context.params.reminderId;

    // Only trigger if status changed to 'done'
    if (before.status === after.status || after.status !== 'done') {
      return;
    }

    try {
      // Get the adult child (creator)
      const childDoc = await db.collection('users').doc(after.createdBy).get();
      
      if (!childDoc.exists) return;

      const child = childDoc.data();
      const expoPushToken = child?.expoPushToken;

      if (!expoPushToken) return;

      // Get parent name
      const parentDoc = await db.collection('users').doc(after.forUser).get();
      const parentName = parentDoc.data()?.name || 'Parent';

      await sendPushNotification({
        to: expoPushToken,
        title: '✅ Task Completed',
        body: `${parentName} completed: ${after.title}`,
        data: {
          type: 'reminder_done',
          reminderId,
        },
        sound: 'default',
      });

      console.log('Reminder completion notification sent for:', reminderId);
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }
  });

/**
 * Triggered when a reminder status is updated to 'missed'.
 * Notifies the adult child that the parent missed the reminder.
 */
export const onReminderMissed = functions.firestore
  .document('reminders/{reminderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as Reminder;
    const after = change.after.data() as Reminder;
    const reminderId = context.params.reminderId;

    // Only trigger if status changed to 'missed'
    if (before.status === after.status || after.status !== 'missed') {
      return;
    }

    try {
      const childDoc = await db.collection('users').doc(after.createdBy).get();
      
      if (!childDoc.exists) return;

      const child = childDoc.data();
      const expoPushToken = child?.expoPushToken;

      if (!expoPushToken) return;

      const parentDoc = await db.collection('users').doc(after.forUser).get();
      const parentName = parentDoc.data()?.name || 'Parent';

      const snoozeInfo = after.snoozeCount > 0 
        ? ` (snoozed ${after.snoozeCount} time${after.snoozeCount > 1 ? 's' : ''})` 
        : '';

      await sendPushNotification({
        to: expoPushToken,
        title: '⚠️ Reminder Missed',
        body: `${parentName} missed: ${after.title}${snoozeInfo}`,
        data: {
          type: 'reminder_missed',
          reminderId,
        },
        sound: 'default',
        badge: 1,
      });

      console.log('Reminder missed notification sent for:', reminderId);
    } catch (error) {
      console.error('Error sending missed notification:', error);
    }
  });

/**
 * Scheduled function to check for missed reminders.
 * Runs every 5 minutes to mark snoozed reminders as missed
 * if they've been snoozed too many times or time has passed.
 */
export const checkMissedReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const maxSnoozeCount = 2; // Max snoozes before marking as missed

    try {
      // Find snoozed reminders that should be marked as missed
      const snoozedReminders = await db
        .collection('reminders')
        .where('status', '==', 'snoozed')
        .where('snoozedUntil', '<=', now)
        .get();

      const batch = db.batch();

      snoozedReminders.docs.forEach((doc) => {
        const reminder = doc.data() as Reminder;
        
        if (reminder.snoozeCount >= maxSnoozeCount) {
          // Mark as missed after max snoozes
          batch.update(doc.ref, {
            status: 'missed',
            updatedAt: now,
          });
        }
      });

      await batch.commit();
      
      console.log(`Processed ${snoozedReminders.size} snoozed reminders`);
    } catch (error) {
      console.error('Error checking missed reminders:', error);
    }
  });
```

---

## Cleanup Functions

```typescript
// functions/src/cleanup.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduled function to clean up old location data.
 * Runs daily at 3 AM to remove locations older than 7 days.
 */
export const cleanupOldLocations = functions.pubsub
  .schedule('0 3 * * *')  // Every day at 3 AM
  .timeZone('UTC')
  .onRun(async () => {
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    try {
      const oldLocations = await db
        .collection('locations')
        .where('timestamp', '<', sevenDaysAgo)
        .limit(500)  // Process in batches
        .get();

      if (oldLocations.empty) {
        console.log('No old locations to clean up');
        return;
      }

      const batch = db.batch();
      oldLocations.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Deleted ${oldLocations.size} old location records`);

      // If there might be more, schedule another run
      if (oldLocations.size === 500) {
        console.log('More locations to clean, will process in next run');
      }
    } catch (error) {
      console.error('Error cleaning up locations:', error);
    }
  });

/**
 * Clean up old resolved emergency alerts.
 * Keeps alerts for 30 days for audit purposes.
 */
export const cleanupOldAlerts = functions.pubsub
  .schedule('0 4 * * *')  // Every day at 4 AM
  .timeZone('UTC')
  .onRun(async () => {
    const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    try {
      const oldAlerts = await db
        .collection('emergencyAlerts')
        .where('status', '==', 'resolved')
        .where('createdAt', '<', thirtyDaysAgo)
        .limit(100)
        .get();

      if (oldAlerts.empty) {
        console.log('No old alerts to clean up');
        return;
      }

      const batch = db.batch();
      oldAlerts.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Deleted ${oldAlerts.size} old emergency alerts`);
    } catch (error) {
      console.error('Error cleaning up alerts:', error);
    }
  });
```

---

## Notification Utility

```typescript
// functions/src/utils/notifications.ts

import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

interface PushNotificationOptions {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

/**
 * Send push notification using Expo Push API
 */
export const sendPushNotification = async (
  options: PushNotificationOptions
): Promise<ExpoPushTicket[]> => {
  const { to, title, body, data, priority, sound, badge, channelId } = options;

  // Validate push token
  if (!Expo.isExpoPushToken(to)) {
    console.error('Invalid Expo push token:', to);
    throw new Error(`Invalid Expo push token: ${to}`);
  }

  const message: ExpoPushMessage = {
    to,
    title,
    body,
    data,
    priority: priority || 'high',
    sound: sound || 'default',
    badge,
    channelId,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    // Log any errors
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'error') {
        console.error(
          `Error sending notification:`,
          ticket.message,
          ticket.details
        );
      }
    });

    return tickets;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send push notifications to multiple users
 */
export const sendBatchNotifications = async (
  notifications: PushNotificationOptions[]
): Promise<ExpoPushTicket[]> => {
  const messages: ExpoPushMessage[] = notifications
    .filter((n) => Expo.isExpoPushToken(n.to))
    .map((n) => ({
      to: n.to,
      title: n.title,
      body: n.body,
      data: n.data,
      priority: n.priority || 'high',
      sound: n.sound || 'default',
      badge: n.badge,
      channelId: n.channelId,
    }));

  if (messages.length === 0) {
    return [];
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending batch notifications:', error);
    }
  }

  return tickets;
};
```

---

## Deployment

### Deploy All Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Specific Function

```bash
firebase deploy --only functions:onEmergencyAlertCreated
```

### View Logs

```bash
firebase functions:log
```

### Local Testing

```bash
# Start emulators
firebase emulators:start --only functions,firestore

# Or use the shell
firebase functions:shell
```

---

## Environment Configuration

Set required environment variables:

```bash
# Set Expo access token for push notifications (if using Expo Push API directly)
firebase functions:config:set expo.access_token="YOUR_EXPO_ACCESS_TOKEN"
```

Access in functions:

```typescript
const expoAccessToken = functions.config().expo?.access_token;
```

---

## Error Handling

All functions should:

1. Log errors with context
2. Not throw errors that would retry endlessly
3. Handle edge cases gracefully

```typescript
// Example error handling pattern
export const myFunction = functions.firestore
  .document('collection/{docId}')
  .onCreate(async (snapshot, context) => {
    try {
      // Function logic
    } catch (error) {
      console.error('Function failed:', {
        docId: context.params.docId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Don't rethrow for non-critical functions
      // Rethrow only if retry is desired
    }
  });
```

---

## Monitoring

### Set Up Alerts

In Firebase Console:
1. Go to Functions
2. Click on a function
3. Set up alerting for errors/latency

### Recommended Alerts

- Emergency function failure rate > 1%
- Function execution time > 10s
- Daily error count > 10

