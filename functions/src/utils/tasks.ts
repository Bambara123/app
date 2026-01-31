/**
 * Cloud Tasks utility for scheduling reminder notifications
 * Uses Google Cloud Tasks to schedule functions at exact times
 */

import {CloudTasksClient} from "@google-cloud/tasks";
import * as logger from "firebase-functions/logger";

// Initialize Cloud Tasks client
const tasksClient = new CloudTasksClient();

// Task queue configuration
const QUEUE_NAME = "reminder-tasks";
const LOCATION = process.env.FUNCTION_REGION || "us-central1";

/**
 * Get the full queue path
 * @return {string} Full queue path
 */
function getQueuePath(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId) {
    throw new Error("Project ID not found in environment");
  }
  return tasksClient.queuePath(projectId, LOCATION, QUEUE_NAME);
}

/**
 * Get the base URL for Cloud Functions
 * @return {string} Base URL for functions
 */
function getFunctionBaseUrl(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  return `https://${LOCATION}-${projectId}.cloudfunctions.net`;
}

/**
 * Create a unique task ID for a reminder
 * @param {string} reminderId - Reminder document ID
 * @param {string} taskType - Type of task (send, timeout)
 * @param {number} ringCount - Ring count for uniqueness
 * @return {string} Unique task ID
 */
function createTaskId(
  reminderId: string,
  taskType: "send" | "timeout",
  ringCount: number
): string {
  // Task IDs must be unique, include timestamp for re-schedules
  const timestamp = Date.now();
  return `${reminderId}-${taskType}-ring${ringCount}-${timestamp}`;
}

/**
 * Schedule a Cloud Task to execute at a specific time
 * @param {string} functionName - Name of the function to call
 * @param {object} payload - Data to send to the function
 * @param {Date} scheduleTime - When to execute the task
 * @param {string} taskId - Unique task ID
 * @return {Promise<string>} Full task name (for cancellation)
 */
async function scheduleTask(
  functionName: string,
  payload: Record<string, unknown>,
  scheduleTime: Date,
  taskId: string
): Promise<string> {
  const queuePath = getQueuePath();
  const functionUrl = `${getFunctionBaseUrl()}/${functionName}`;

  // Ensure schedule time is in the future
  const now = new Date();
  if (scheduleTime <= now) {
    // If in the past, schedule for 5 seconds from now
    scheduleTime = new Date(now.getTime() + 5000);
  }

  // Cloud Tasks has a 30-day limit
  const maxScheduleTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (scheduleTime > maxScheduleTime) {
    throw new Error(
      "Cannot schedule task more than 30 days in advance. " +
      `Requested: ${scheduleTime.toISOString()}`
    );
  }

  const task = {
    name: `${queuePath}/tasks/${taskId}`,
    httpRequest: {
      httpMethod: "POST" as const,
      url: functionUrl,
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      // Use OIDC token for authentication
      // Explicitly use Compute Engine service account
      oidcToken: {
        serviceAccountEmail:
          "392478570946-compute@developer.gserviceaccount.com",
      },
    },
    scheduleTime: {
      seconds: Math.floor(scheduleTime.getTime() / 1000),
    },
  };

  try {
    const [response] = await tasksClient.createTask({
      parent: queuePath,
      task,
    });

    logger.info("Cloud Task scheduled", {
      taskName: response.name,
      functionName,
      scheduleTime: scheduleTime.toISOString(),
    });

    return response.name || "";
  } catch (error: unknown) {
    // Handle "already exists" error gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("ALREADY_EXISTS")) {
      logger.warn("Task already exists, skipping", {taskId});
      return `${queuePath}/tasks/${taskId}`;
    }
    throw error;
  }
}

/**
 * Cancel a scheduled Cloud Task
 * @param {string} taskName - Full task name to cancel
 * @return {Promise<boolean>} True if cancelled, false if not found
 */
export async function cancelTask(taskName: string): Promise<boolean> {
  if (!taskName) {
    return false;
  }

  try {
    await tasksClient.deleteTask({name: taskName});
    logger.info("Cloud Task cancelled", {taskName});
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Task not found is OK - it may have already executed or been cancelled
    if (errorMessage.includes("NOT_FOUND")) {
      logger.info("Task not found (may have already executed)", {taskName});
      return false;
    }
    logger.error("Error cancelling task", {taskName, error: errorMessage});
    throw error;
  }
}

/**
 * Schedule the "send push notification" task for a reminder
 * @param {string} reminderId - Reminder document ID
 * @param {Date} scheduleTime - When the reminder should fire
 * @param {number} ringCount - Current ring count (1 or 2)
 * @return {Promise<string>} Task name for cancellation
 */
export async function scheduleSendPushTask(
  reminderId: string,
  scheduleTime: Date,
  ringCount = 1
): Promise<string> {
  const taskId = createTaskId(reminderId, "send", ringCount);

  return scheduleTask(
    "sendReminderPush",
    {reminderId, ringCount},
    scheduleTime,
    taskId
  );
}

/**
 * Schedule the "timeout check" task for a reminder
 * Fires 2 minutes after the scheduled reminder time
 * @param {string} reminderId - Reminder document ID
 * @param {Date} reminderTime - When the reminder was scheduled
 * @param {number} ringCount - Current ring count (1 or 2)
 * @return {Promise<string>} Task name for cancellation
 */
export async function scheduleTimeoutTask(
  reminderId: string,
  reminderTime: Date,
  ringCount = 1
): Promise<string> {
  // Schedule timeout check for 2 minutes after reminder time
  const timeoutTime = new Date(reminderTime.getTime() + 2 * 60 * 1000);
  const taskId = createTaskId(reminderId, "timeout", ringCount);

  return scheduleTask(
    "checkReminderTimeout",
    {
      reminderId,
      ringCount,
      originalScheduleTime: reminderTime.toISOString(),
    },
    timeoutTime,
    taskId
  );
}

/**
 * Schedule both send and timeout tasks for a new reminder
 * @param {string} reminderId - Reminder document ID
 * @param {Date} scheduleTime - When the reminder should fire
 * @param {number} ringCount - Ring count (default 1)
 * @return {Promise<{sendTaskName: string, timeoutTaskName: string}>}
 */
export async function scheduleReminderTasks(
  reminderId: string,
  scheduleTime: Date,
  ringCount = 1
): Promise<{sendTaskName: string; timeoutTaskName: string}> {
  // Schedule both tasks
  const [sendTaskName, timeoutTaskName] = await Promise.all([
    scheduleSendPushTask(reminderId, scheduleTime, ringCount),
    scheduleTimeoutTask(reminderId, scheduleTime, ringCount),
  ]);

  return {sendTaskName, timeoutTaskName};
}

/**
 * Cancel all tasks for a reminder
 * @param {string | null | undefined} sendTaskName - Send task name
 * @param {string | null | undefined} timeoutTaskName - Timeout task name
 */
export async function cancelReminderTasks(
  sendTaskName: string | null | undefined,
  timeoutTaskName: string | null | undefined
): Promise<void> {
  const promises: Promise<boolean>[] = [];

  if (sendTaskName) {
    promises.push(cancelTask(sendTaskName));
  }
  if (timeoutTaskName) {
    promises.push(cancelTask(timeoutTaskName));
  }

  await Promise.all(promises);
}
