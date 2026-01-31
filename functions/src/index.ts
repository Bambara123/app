/**
 * ElderCare Cloud Functions
 *
 * Task-based notification system using Cloud Tasks
 * - More cost-effective than polling
 * - Precise timing for reminder notifications
 * - Automatic timeout handling
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  sendReminderNotification,
  sendPushNotification,
} from "./utils/notifications";
import {
  scheduleReminderTasks,
  cancelReminderTasks,
  scheduleTimeoutTask,
} from "./utils/tasks";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// Set global options for all functions
setGlobalOptions({maxInstances: 10, region: "us-central1"});

// ============================================
// FIRESTORE TRIGGERS
// ============================================

/**
 * Triggered when a new reminder is created.
 * Schedules Cloud Tasks for:
 * 1. Sending push notification at reminder time
 * 2. Checking for timeout 2 minutes after reminder time
 */
export const onReminderCreated = onDocumentCreated(
  "reminders/{reminderId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No data in reminder document");
      return;
    }

    const reminder = snapshot.data();
    const reminderId = event.params.reminderId;

    // Get reminder dateTime
    const reminderDateTime =
      reminder.dateTime instanceof Timestamp ?
        reminder.dateTime.toDate() :
        new Date(reminder.dateTime);

    // Skip if reminder is in the past
    if (reminderDateTime <= new Date()) {
      logger.warn("Reminder is in the past, skipping task scheduling", {
        reminderId,
        scheduledTime: reminderDateTime.toISOString(),
      });
      return;
    }

    logger.info("Scheduling tasks for new reminder", {
      reminderId,
      title: reminder.title,
      forUser: reminder.forUser,
      scheduledTime: reminderDateTime.toISOString(),
    });

    try {
      // Schedule both send and timeout tasks
      const {sendTaskName, timeoutTaskName} = await scheduleReminderTasks(
        reminderId,
        reminderDateTime,
        reminder.ringCount || 1
      );

      // Store task names in Firestore for later cancellation
      await snapshot.ref.update({
        sendTaskName,
        timeoutTaskName,
      });

      logger.info("Tasks scheduled successfully", {
        reminderId,
        sendTaskName,
        timeoutTaskName,
      });
    } catch (error) {
      logger.error("Error scheduling tasks for reminder", {
        reminderId,
        error,
      });
    }
  }
);

/**
 * Triggered when a reminder is updated.
 * Handles rescheduling when dateTime changes.
 */
export const onReminderUpdated = onDocumentUpdated(
  "reminders/{reminderId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      return;
    }

    const reminderId = event.params.reminderId;

    // Get dateTime values
    const beforeDateTime =
      before.dateTime instanceof Timestamp ?
        before.dateTime.toDate() :
        new Date(before.dateTime);

    const afterDateTime =
      after.dateTime instanceof Timestamp ?
        after.dateTime.toDate() :
        new Date(after.dateTime);

    // Check if dateTime changed (reschedule needed)
    const dateTimeChanged =
      beforeDateTime.getTime() !== afterDateTime.getTime();

    // Check if status changed to non-pending (cancel tasks)
    const statusChangedToNonPending =
      before.status === "pending" && after.status !== "pending";

    if (statusChangedToNonPending) {
      // Cancel existing tasks
      logger.info("Status changed to non-pending, cancelling tasks", {
        reminderId,
        newStatus: after.status,
      });

      await cancelReminderTasks(after.sendTaskName, after.timeoutTaskName);
      return;
    }

    if (dateTimeChanged && after.status === "pending") {
      logger.info("Reminder rescheduled, updating tasks", {
        reminderId,
        oldTime: beforeDateTime.toISOString(),
        newTime: afterDateTime.toISOString(),
      });

      // Cancel old tasks
      await cancelReminderTasks(before.sendTaskName, before.timeoutTaskName);

      // Skip if new time is in the past
      if (afterDateTime <= new Date()) {
        logger.warn("New schedule time is in the past, not rescheduling", {
          reminderId,
        });
        return;
      }

      try {
        // Schedule new tasks
        const {sendTaskName, timeoutTaskName} = await scheduleReminderTasks(
          reminderId,
          afterDateTime,
          after.ringCount || 1
        );

        // Update task names in Firestore
        await event.data?.after?.ref.update({
          sendTaskName,
          timeoutTaskName,
        });

        logger.info("Tasks rescheduled successfully", {
          reminderId,
          sendTaskName,
          timeoutTaskName,
        });
      } catch (error) {
        logger.error("Error rescheduling tasks", {reminderId, error});
      }
    }
  }
);

/**
 * Triggered when a reminder is deleted.
 * Cancels any scheduled tasks.
 */
export const onReminderDeleted = onDocumentDeleted(
  "reminders/{reminderId}",
  async (event) => {
    const reminder = event.data?.data();
    if (!reminder) {
      return;
    }

    const reminderId = event.params.reminderId;

    logger.info("Reminder deleted, cancelling tasks", {reminderId});

    await cancelReminderTasks(reminder.sendTaskName, reminder.timeoutTaskName);
  }
);

// ============================================
// CLOUD TASK HANDLERS (HTTP Functions)
// ============================================

/**
 * HTTP function called by Cloud Task at scheduled reminder time.
 * Sends the push notification to the parent.
 */
export const sendReminderPush = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    // Verify request is from Cloud Tasks
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const {reminderId, ringCount} = req.body;

    if (!reminderId) {
      logger.error("Missing reminderId in request body");
      res.status(400).send("Missing reminderId");
      return;
    }

    logger.info("Sending reminder push notification", {reminderId, ringCount});

    try {
      // Get reminder from Firestore
      const reminderDoc = await db
        .collection("reminders")
        .doc(reminderId)
        .get();

      if (!reminderDoc.exists) {
        logger.warn("Reminder not found, may have been deleted", {reminderId});
        res.status(200).send("Reminder not found");
        return;
      }

      const reminder = reminderDoc.data();

      // Check if reminder is still pending
      if (reminder?.status !== "pending") {
        logger.info("Reminder is no longer pending, skipping push", {
          reminderId,
          status: reminder?.status,
        });
        res.status(200).send("Reminder not pending");
        return;
      }

      // Get parent's push token
      const parentDoc = await db
        .collection("users")
        .doc(reminder.forUser)
        .get();

      if (!parentDoc.exists) {
        logger.error("Parent user not found", {forUser: reminder.forUser});
        res.status(200).send("User not found");
        return;
      }

      const parentData = parentDoc.data();
      const pushToken = parentData?.expoPushToken;

      if (!pushToken) {
        logger.warn("Parent has no push token", {forUser: reminder.forUser});
        res.status(200).send("No push token");
        return;
      }

      // Send push notification
      const success = await sendReminderNotification(
        pushToken,
        reminderId,
        reminder.title || "Reminder",
        reminder.description || "Time for your reminder!"
      );

      if (success) {
        logger.info("Reminder notification sent successfully", {reminderId});

        // Update reminder to mark notification as sent
        await reminderDoc.ref.update({
          serverNotificationSent: true,
          serverNotificationSentAt: Timestamp.now(),
        });
      } else {
        logger.error("Failed to send reminder notification", {reminderId});
      }

      res.status(200).send("OK");
    } catch (error) {
      logger.error("Error in sendReminderPush", {reminderId, error});
      // Return 200 to prevent Cloud Tasks from retrying
      res.status(200).send("Error handled");
    }
  }
);

/**
 * HTTP function called by Cloud Task 2 minutes after reminder time.
 * Checks if reminder is still pending and handles timeout.
 */
export const checkReminderTimeout = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const {reminderId, ringCount, originalScheduleTime} = req.body;

    if (!reminderId) {
      logger.error("Missing reminderId in request body");
      res.status(400).send("Missing reminderId");
      return;
    }

    logger.info("Checking reminder timeout", {
      reminderId,
      ringCount,
      originalScheduleTime,
    });

    try {
      // Get reminder from Firestore
      const reminderDoc = await db
        .collection("reminders")
        .doc(reminderId)
        .get();

      if (!reminderDoc.exists) {
        logger.warn("Reminder not found", {reminderId});
        res.status(200).send("Reminder not found");
        return;
      }

      const reminder = reminderDoc.data();

      // Check if reminder is still pending (not acted upon)
      if (reminder?.status !== "pending") {
        logger.info("Reminder already handled, no timeout action needed", {
          reminderId,
          status: reminder?.status,
        });
        res.status(200).send("Already handled");
        return;
      }

      const currentRingCount = reminder.ringCount || 1;

      // Get user ref for updating missedReminders counter
      const userRef = db.collection("users").doc(reminder.forUser);

      if (currentRingCount >= 2) {
        // Second ring timeout - mark as final missed
        logger.info("Second ring timeout - marking as missed", {reminderId});

        await reminderDoc.ref.update({
          status: "missed",
          missCount: (reminder.missCount || 0) + 1,
        });

        // Increment user's missedReminders counter
        await userRef.update({
          missedReminders: FieldValue.increment(1),
        });

        // Send escalation to child
        await sendEscalationToChild(reminder, reminderId);
      } else {
        // First ring timeout - reschedule for 2nd ring
        const followUpMinutes = reminder.followUpMinutes || 10;
        const rescheduleTime = new Date(
          Date.now() + followUpMinutes * 60 * 1000
        );

        logger.info("First ring timeout - rescheduling for 2nd ring", {
          reminderId,
          rescheduleTime: rescheduleTime.toISOString(),
        });

        // Update reminder with new time and ring count
        // This will trigger onReminderUpdated which will schedule new tasks
        await reminderDoc.ref.update({
          dateTime: Timestamp.fromDate(rescheduleTime),
          ringCount: 2,
          missCount: (reminder.missCount || 0) + 1,
          serverNotificationSent: false,
        });
      }

      res.status(200).send("OK");
    } catch (error) {
      logger.error("Error in checkReminderTimeout", {reminderId, error});
      res.status(200).send("Error handled");
    }
  }
);

// ============================================
// CALLABLE FUNCTIONS (for client-side actions)
// ============================================

/**
 * Callable function for handling reminder actions (Done, Snooze, Dismiss)
 * Called from the client app when user interacts with reminder
 */
export const handleReminderAction = onCall(
  {region: "us-central1"},
  async (request) => {
    const {reminderId, action, snoozeMinutes} = request.data;

    if (!reminderId || !action) {
      throw new HttpsError(
        "invalid-argument",
        "Missing reminderId or action"
      );
    }

    logger.info("Handling reminder action", {
      reminderId,
      action,
      snoozeMinutes,
    });

    try {
      const reminderDoc = await db
        .collection("reminders")
        .doc(reminderId)
        .get();

      if (!reminderDoc.exists) {
        throw new HttpsError("not-found", "Reminder not found");
      }

      const reminder = reminderDoc.data();

      // Cancel existing timeout task (send task should have already executed)
      if (reminder?.timeoutTaskName) {
        await cancelReminderTasks(null, reminder.timeoutTaskName);
      }

      switch (action) {
      case "done":
        await handleDone(reminderDoc, reminder);
        break;

      case "snooze":
        await handleSnooze(
          reminderDoc,
          reminder,
          snoozeMinutes || reminder?.followUpMinutes || 10
        );
        break;

      case "im_on_it":
        await handleImOnIt(
          reminderDoc,
          reminder,
          snoozeMinutes || reminder?.followUpMinutes || 10
        );
        break;

      case "dismiss":
        await handleDismiss(reminderDoc, reminder);
        break;

      default:
        throw new HttpsError("invalid-argument", `Unknown action: ${action}`);
      }

      return {success: true};
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("Error handling reminder action", {
        reminderId,
        action,
        error,
      });
      throw new HttpsError("internal", "Failed to handle action");
    }
  }
);

/**
 * Handle "Done" action - mark reminder as complete
 * @param {FirebaseFirestore.DocumentSnapshot} reminderDoc - Reminder doc
 * @param {FirebaseFirestore.DocumentData | undefined} reminder - Reminder data
 * @return {Promise<void>}
 */
async function handleDone(
  reminderDoc: FirebaseFirestore.DocumentSnapshot,
  reminder: FirebaseFirestore.DocumentData | undefined
): Promise<void> {
  await reminderDoc.ref.update({
    status: "done",
    completedAt: Timestamp.now(),
  });

  logger.info("Reminder marked as done", {reminderId: reminderDoc.id});

  // Notify child that parent completed the task
  if (reminder?.forUser) {
    await notifyChildOfCompletion(reminder, reminderDoc.id);
  }
}

/**
 * Handle "Snooze" action - reschedule for later
 * @param {FirebaseFirestore.DocumentSnapshot} reminderDoc - Reminder doc
 * @param {FirebaseFirestore.DocumentData | undefined} reminder - Reminder data
 * @param {number} minutes - Minutes to snooze
 * @return {Promise<void>}
 */
async function handleSnooze(
  reminderDoc: FirebaseFirestore.DocumentSnapshot,
  reminder: FirebaseFirestore.DocumentData | undefined,
  minutes: number
): Promise<void> {
  const rescheduleTime = new Date(Date.now() + minutes * 60 * 1000);

  // Schedule new timeout task only (push was already sent)
  const timeoutTaskName = await scheduleTimeoutTask(
    reminderDoc.id,
    rescheduleTime,
    2 // Snoozed reminders are always ring 2
  );

  await reminderDoc.ref.update({
    dateTime: Timestamp.fromDate(rescheduleTime),
    snoozedUntil: Timestamp.fromDate(rescheduleTime),
    snoozeCount: ((reminder?.snoozeCount || 0) + 1),
    ringCount: 2, // Next ring is final
    timeoutTaskName,
    serverNotificationSent: false,
  });

  // Increment user's missed counter for snoozed reminders
  if (reminder?.forUser) {
    await db.collection("users").doc(reminder.forUser).update({
      missedReminders: FieldValue.increment(1),
    });
  }

  logger.info("Reminder snoozed", {
    reminderId: reminderDoc.id,
    rescheduleTime: rescheduleTime.toISOString(),
  });
}

/**
 * Handle "I'm On It" action - acknowledge and reschedule follow-up
 * @param {FirebaseFirestore.DocumentSnapshot} reminderDoc - Reminder doc
 * @param {FirebaseFirestore.DocumentData | undefined} reminder - Reminder data
 * @param {number} minutes - Minutes until follow-up
 * @return {Promise<void>}
 */
async function handleImOnIt(
  reminderDoc: FirebaseFirestore.DocumentSnapshot,
  reminder: FirebaseFirestore.DocumentData | undefined,
  minutes: number
): Promise<void> {
  const rescheduleTime = new Date(Date.now() + minutes * 60 * 1000);

  // Schedule new timeout task only
  const timeoutTaskName = await scheduleTimeoutTask(
    reminderDoc.id,
    rescheduleTime,
    2
  );

  await reminderDoc.ref.update({
    dateTime: Timestamp.fromDate(rescheduleTime),
    ringCount: 2,
    timeoutTaskName,
    serverNotificationSent: false,
  });

  // Increment user's missed counter for acknowledged but incomplete reminders
  if (reminder?.forUser) {
    await db.collection("users").doc(reminder.forUser).update({
      missedReminders: FieldValue.increment(1),
    });
  }

  logger.info("Reminder acknowledged (I'm On It)", {
    reminderId: reminderDoc.id,
    rescheduleTime: rescheduleTime.toISOString(),
  });
}

/**
 * Handle "Dismiss" action - mark as missed
 * @param {FirebaseFirestore.DocumentSnapshot} reminderDoc - Reminder doc
 * @param {FirebaseFirestore.DocumentData | undefined} reminder - Reminder data
 * @return {Promise<void>}
 */
async function handleDismiss(
  reminderDoc: FirebaseFirestore.DocumentSnapshot,
  reminder: FirebaseFirestore.DocumentData | undefined
): Promise<void> {
  await reminderDoc.ref.update({
    status: "missed",
    missCount: ((reminder?.missCount || 0) + 1),
  });

  // Increment user's missed counter
  if (reminder?.forUser) {
    await db.collection("users").doc(reminder.forUser).update({
      missedReminders: FieldValue.increment(1),
    });
  }

  logger.info("Reminder dismissed by user", {reminderId: reminderDoc.id});

  // Notify child of dismissal
  if (reminder?.forUser) {
    await sendEscalationToChild(reminder, reminderDoc.id, true);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send escalation notification to child/caregiver when parent misses
 * @param {FirebaseFirestore.DocumentData} reminder - Reminder data
 * @param {string} reminderId - Reminder document ID
 * @param {boolean} wasDismissed - Whether reminder was dismissed by user
 * @return {Promise<void>}
 */
async function sendEscalationToChild(
  reminder: FirebaseFirestore.DocumentData,
  reminderId: string,
  wasDismissed = false
): Promise<void> {
  try {
    const parentDoc = await db
      .collection("users")
      .doc(reminder.forUser)
      .get();

    if (!parentDoc.exists) {
      return;
    }

    const parentData = parentDoc.data();
    const childUserId = parentData?.connectedTo;

    if (!childUserId) {
      return;
    }

    const childDoc = await db.collection("users").doc(childUserId).get();

    if (!childDoc.exists) {
      return;
    }

    const childData = childDoc.data();
    const pushToken = childData?.expoPushToken;

    if (!pushToken) {
      return;
    }

    const parentName =
      parentData?.nickname || parentData?.name || "Your parent";

    const title = wasDismissed ?
      "⚠️ Reminder Dismissed" :
      "🚨 Check on Your Parent";

    const body = wasDismissed ?
      `${parentName} dismissed "${reminder.title}". ` +
        "You may want to check on them." :
      `${parentName} has not done "${reminder.title}". ` +
        "Better to call and check on them.";

    await sendPushNotification(pushToken, title, body, {
      type: wasDismissed ? "reminder_dismissed" : "reminder_escalation",
      reminderId,
    });

    logger.info("Escalation notification sent to child", {
      reminderId,
      childUserId,
      wasDismissed,
    });
  } catch (error) {
    logger.error("Error sending escalation notification", {error});
  }
}

/**
 * Notify child that parent completed a reminder
 * @param {FirebaseFirestore.DocumentData} reminder - Reminder data
 * @param {string} reminderId - Reminder document ID
 * @return {Promise<void>}
 */
async function notifyChildOfCompletion(
  reminder: FirebaseFirestore.DocumentData,
  reminderId: string
): Promise<void> {
  try {
    const parentDoc = await db
      .collection("users")
      .doc(reminder.forUser)
      .get();

    if (!parentDoc.exists) {
      return;
    }

    const parentData = parentDoc.data();
    const childUserId = parentData?.connectedTo;

    if (!childUserId) {
      return;
    }

    const childDoc = await db.collection("users").doc(childUserId).get();

    if (!childDoc.exists) {
      return;
    }

    const childData = childDoc.data();
    const pushToken = childData?.expoPushToken;

    if (!pushToken) {
      return;
    }

    const parentName =
      parentData?.nickname || parentData?.name || "Your parent";

    await sendPushNotification(
      pushToken,
      "✅ Task Completed",
      `Great news! ${parentName} completed "${reminder.title}".`,
      {
        type: "reminder_done",
        reminderId,
      }
    );

    logger.info("Completion notification sent to child", {
      reminderId,
      childUserId,
    });
  } catch (error) {
    logger.error("Error sending completion notification", {error});
  }
}
