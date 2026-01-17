// src/stores/reminderStore.ts
// Reminder state management

import { create } from 'zustand';
import {
  Reminder,
  CreateReminderInput,
  ReminderFilters,
  ReminderFilterLabel,
  ReminderFilterStatus,
} from '../types';
interface ReminderState {
  // State
  reminders: Reminder[];
  filters: ReminderFilters;
  filteredReminders: Reminder[];
  selectedReminder: Reminder | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: (userId: string, isParent: boolean) => () => void;
  createReminder: (
    createdBy: string,
    forUser: string,
    input: CreateReminderInput
  ) => Promise<Reminder>;
  updateReminder: (reminderId: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  markAsDone: (reminderId: string, childUserId?: string | null, reminderTitle?: string, parentNickname?: string | null) => Promise<void>;
  markAsMissed: (reminderId: string, childUserId?: string | null, reminderTitle?: string, followUpMinutes?: number, parentNickname?: string | null) => Promise<void>;
  snooze: (reminderId: string, minutes?: number, childUserId?: string | null, currentSnoozeCount?: number, reminderTitle?: string, followUpMinutes?: number, parentNickname?: string | null) => Promise<void>;
  // Handle when reminder alarm is triggered (for timeout tracking)
  handleAlarmTriggered: (reminderId: string) => Promise<void>;
  // Handle auto-miss when timeout expires
  handleAutoMiss: (reminderId: string, childUserId?: string | null, parentNickname?: string | null) => Promise<void>;
  // Check if reminder has timed out
  isReminderTimedOut: (reminderId: string) => boolean;
  setFilters: (filters: Partial<ReminderFilters>) => void;
  setSelectedReminder: (reminder: Reminder | null) => void;
  reset: () => void;
}

const applyFilters = (
  reminders: Reminder[],
  filters: ReminderFilters
): Reminder[] => {
  return reminders.filter((reminder) => {
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = reminder.title.toLowerCase().includes(query);
      const matchesDescription =
        reminder.description?.toLowerCase().includes(query) || false;
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Label filter
    if (filters.label !== 'all' && reminder.label !== filters.label) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && reminder.status !== filters.status) {
      return false;
    }

    return true;
  });
};

export const useReminderStore = create<ReminderState>((set, get) => ({
  // Initial state
  reminders: [],
  filters: {
    searchQuery: '',
    label: 'all',
    status: 'all',
  },
  filteredReminders: [],
  selectedReminder: null,
  isLoading: false,
  error: null,

  // Initialize reminders subscription
  initialize: (userId: string, isParent: boolean) => {
    set({ isLoading: true });

    const initFirebase = async () => {
      try {
        const { reminderService } = await import('../services/firebase/firestore');
        
        return reminderService.subscribeToReminders(
          userId,
          isParent,
          (reminders) => {
            const { filters } = get();
            set({
              reminders,
              filteredReminders: applyFilters(reminders, filters),
              isLoading: false,
            });
          }
        );
      } catch (error) {
        console.error('Failed to initialize reminders:', error);
        set({ isLoading: false, error: 'Failed to load reminders' });
        return () => {};
      }
    };

    let unsubscribe: (() => void) | null = null;
    initFirebase().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  },

  // Create new reminder
  createReminder: async (
    createdBy: string,
    forUser: string,
    input: CreateReminderInput
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { scheduleReminderNotification } = await import('../services/notifications');

      const reminder = await reminderService.createReminder(
        createdBy,
        forUser,
        input
      );

      const notificationId = await scheduleReminderNotification(
        reminder.id,
        reminder.title,
        reminder.description || 'Time for your reminder!',
        reminder.dateTime
      );

      await reminderService.updateReminder(reminder.id, { notificationId });

      set({ isLoading: false });
      return { ...reminder, notificationId };
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update reminder
  updateReminder: async (reminderId: string, data: Partial<Reminder>) => {
    set({ isLoading: true, error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { scheduleReminderNotification, cancelNotification } = await import('../services/notifications');

      await reminderService.updateReminder(reminderId, data);

      if (data.dateTime) {
        const { reminders } = get();
        const reminder = reminders.find((r) => r.id === reminderId);
        
        if (reminder?.notificationId) {
          await cancelNotification(reminder.notificationId);
        }

        const notificationId = await scheduleReminderNotification(
          reminderId,
          data.title || reminder?.title || 'Reminder',
          data.description || reminder?.description || 'Time for your reminder!',
          data.dateTime
        );

        await reminderService.updateReminder(reminderId, { notificationId });
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete reminder
  deleteReminder: async (reminderId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { cancelNotification } = await import('../services/notifications');

      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      await reminderService.deleteReminder(reminderId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  // Mark reminder as done
  markAsDone: async (reminderId: string, childUserId?: string | null, reminderTitle?: string, parentNickname?: string | null) => {
    set({ error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { cancelNotification, sendLocalNotification } = await import('../services/notifications');

      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      await reminderService.markAsDone(reminderId);

      // Send notification to child/caregiver that parent completed the task
      if (childUserId) {
        const title = reminderTitle || reminder?.title || 'Reminder';
        const parentName = parentNickname || 'Your parent';
        await sendLocalNotification(
          '✅ Task Completed',
          `Great news! ${parentName} completed "${title}".`,
          { type: 'reminder_done', reminderId }
        );
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark as done' });
      throw error;
    }
  },

  // Mark reminder as missed (auto-timeout after 1 minute, max 2 rings total)
  markAsMissed: async (reminderId: string, childUserId?: string | null, reminderTitle?: string, followUpMinutes?: number, parentNickname?: string | null) => {
    set({ error: null });

    const { reminders } = get();
    const reminder = reminders.find((r) => r.id === reminderId);
    const snoozeCount = reminder?.snoozeCount ?? 0;
    const missCount = reminder?.missCount ?? 0;
    const totalAttempts = snoozeCount + missCount;

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { cancelNotification, sendLocalNotification, scheduleReminderNotification } = await import('../services/notifications');

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      const parentName = parentNickname || 'Your parent';

      // If this is the 2nd ring (already snoozed or missed once), make status final and notify child
      if (totalAttempts >= 1) {
        // Final status - missed, no more rescheduling
        await reminderService.updateReminder(reminderId, { 
          status: 'missed', 
          missCount: missCount + 1 
        });

        // Send urgent notification to child
        if (childUserId) {
          const title = reminderTitle || reminder?.title || 'Reminder';
          await sendLocalNotification(
            '🚨 Check on Your Parent',
            `${parentName} has not done "${title}". Better to call and check on them.`,
            { type: 'reminder_escalation', reminderId }
          );
        }
      } else {
        // First miss - reschedule for follow-up
        await reminderService.updateReminder(reminderId, { 
          status: 'missed', 
          missCount: missCount + 1 
        });

        // Notify child about miss
        if (childUserId) {
          const title = reminderTitle || reminder?.title || 'Reminder';
          const rescheduleMinutes = followUpMinutes || reminder?.followUpMinutes || 10;
          await sendLocalNotification(
            '⏰ Reminder Missed',
            `${parentName} didn't respond to "${title}". It will ring again in ${rescheduleMinutes} minutes.`,
            { type: 'reminder_missed', reminderId }
          );
        }

        // Schedule the reminder to ring again after followUpMinutes
        const rescheduleMinutes = followUpMinutes || reminder?.followUpMinutes || 10;
        const rescheduleTime = new Date(Date.now() + rescheduleMinutes * 60 * 1000);
        const notificationId = await scheduleReminderNotification(
          reminderId,
          reminder?.title || 'Reminder',
          `Missed reminder: ${reminder?.description || 'Please check this reminder!'}`,
          rescheduleTime
        );

        await reminderService.updateReminder(reminderId, { 
          notificationId,
          dateTime: rescheduleTime,
          status: 'pending' // Reset to pending for the 2nd ring
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark as missed' });
      throw error;
    }
  },

  // Snooze reminder (max 1 snooze = 2 rings total)
  snooze: async (reminderId: string, minutes = 10, childUserId?: string | null, currentSnoozeCount?: number, reminderTitle?: string, followUpMinutes?: number, parentNickname?: string | null) => {
    set({ error: null });

    const { reminders } = get();
    const reminder = reminders.find((r) => r.id === reminderId);
    const snoozeCount = currentSnoozeCount ?? reminder?.snoozeCount ?? 0;
    const missCount = reminder?.missCount ?? 0;
    const totalAttempts = snoozeCount + missCount;

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { scheduleReminderNotification, cancelNotification, sendLocalNotification } = await import('../services/notifications');

      const rescheduleMinutes = followUpMinutes || reminder?.followUpMinutes || 10;

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      const parentName = parentNickname || 'Your parent';

      // If this is the 2nd ring (already snoozed or missed once), make status final and notify child
      if (totalAttempts >= 1) {
        // Final status - snoozed, no more rescheduling
        await reminderService.updateReminder(reminderId, { 
          status: 'snoozed',
          snoozeCount: snoozeCount + 1,
          snoozedUntil: new Date()
        });

        // Send urgent notification to child
        if (childUserId) {
          const title = reminderTitle || reminder?.title || 'Reminder';
          await sendLocalNotification(
            '🚨 Check on Your Parent',
            `${parentName} has not done "${title}". Better to call and check on them.`,
            { type: 'reminder_escalation', reminderId }
          );
        }
      } else {
        // First snooze - reschedule for follow-up
        await reminderService.snooze(reminderId, rescheduleMinutes);

        const snoozedUntil = new Date(Date.now() + rescheduleMinutes * 60 * 1000);
        const notificationId = await scheduleReminderNotification(
          reminderId,
          reminder?.title || 'Reminder',
          `Snoozed reminder: ${reminder?.description || 'Time for your reminder!'}`,
          snoozedUntil
        );

        await reminderService.updateReminder(reminderId, { 
          notificationId,
          dateTime: snoozedUntil,
          status: 'pending' // Reset to pending for the 2nd ring
        });

        // Notify child about snooze
        if (childUserId) {
          const title = reminderTitle || reminder?.title || 'Reminder';
          await sendLocalNotification(
            '😴 Reminder Snoozed',
            `${parentName} snoozed "${title}". It will ring again in ${rescheduleMinutes} minutes.`,
            { type: 'reminder_snoozed', reminderId }
          );
        }
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to snooze' });
      throw error;
    }
  },

  // Handle when reminder alarm is triggered (marks trigger time for timeout tracking)
  handleAlarmTriggered: async (reminderId: string) => {
    console.log('handleAlarmTriggered', reminderId);
    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { scheduleAutoMissNotification } = await import('../services/notifications');

      const { reminders, filters } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      // Only mark trigger if not already triggered and still pending
      if (reminder && !reminder.alarmTriggeredAt && reminder.status === 'pending') {
        const triggerTime = new Date();
        
        // Schedule auto-miss notification for 1 minute later
        const missNotificationId = await scheduleAutoMissNotification(reminderId, triggerTime);

        await reminderService.updateReminder(reminderId, {
          alarmTriggeredAt: triggerTime,
          missNotificationId,
        });

        // Update local state immediately
        const updatedReminders = reminders.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                alarmTriggeredAt: triggerTime,
                missNotificationId,
              }
            : r
        );
        set({
          reminders: updatedReminders,
          filteredReminders: applyFilters(updatedReminders, filters),
        });
      }
    } catch (error) {
      console.error('Failed to mark alarm triggered:', error);
    }
  },

  // Handle auto-miss when timeout expires (called by notification or when checking status)
  handleAutoMiss: async (reminderId: string, childUserId?: string | null, parentNickname?: string | null) => {
    try {
      console.log('handleAutoMiss', reminderId, childUserId, parentNickname);
      const { reminderService } = await import('../services/firebase/firestore');
      const { cancelNotification, sendLocalNotification, scheduleReminderNotification } = await import('../services/notifications');

      const { reminders, filters } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      // Only process if reminder is still pending (user hasn't acted yet)
      if (!reminder || reminder.status !== 'pending') {
        return;
      }

      const snoozeCount = reminder.snoozeCount ?? 0;
      const missCount = reminder.missCount ?? 0;
      const totalAttempts = snoozeCount + missCount;
      const parentName = parentNickname || 'Your parent';

      // Cancel any existing notifications
      if (reminder.notificationId) {
        await cancelNotification(reminder.notificationId);
      }
      if (reminder.missNotificationId) {
        await cancelNotification(reminder.missNotificationId);
      }

      console.log('totalAttempts', totalAttempts, missCount, snoozeCount);
      // If this is the 2nd ring (already snoozed or missed once), make status final
      if (totalAttempts >= 1) {
        await reminderService.updateReminder(reminderId, {
          status: 'missed',
          missCount: missCount + 1,
          alarmTriggeredAt: null,
          missNotificationId: null,
        });

        // Update local state immediately
        const updatedReminders = reminders.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                status: 'missed' as const,
                missCount: missCount + 1,
                alarmTriggeredAt: null,
                missNotificationId: null,
              }
            : r
        );
        set({
          reminders: updatedReminders,
          filteredReminders: applyFilters(updatedReminders, filters),
        });

        // Send urgent notification to child
        if (childUserId) {
          await sendLocalNotification(
            '🚨 Check on Your Parent',
            `${parentName} has not done "${reminder.title}". Better to call and check on them.`,
            { type: 'reminder_escalation', reminderId }
          );
        }
      } else {
        // First miss - reschedule for follow-up
        const rescheduleMinutes = reminder.followUpMinutes || 10;
        const rescheduleTime = new Date(Date.now() + rescheduleMinutes * 60 * 1000);

        const notificationId = await scheduleReminderNotification(
          reminderId,
          reminder.title,
          `Missed reminder: ${reminder.description || 'Please check this reminder!'}`,
          rescheduleTime
        );

        await reminderService.updateReminder(reminderId, {
          status: 'pending',
          missCount: missCount + 1,
          dateTime: rescheduleTime,
          notificationId,
          alarmTriggeredAt: null,
          missNotificationId: null,
        });

        // Update local state immediately
        const updatedReminders = reminders.map((r) =>
          r.id === reminderId
            ? {
                ...r,
                status: 'pending' as const,
                missCount: missCount + 1,
                dateTime: rescheduleTime,
                notificationId,
                alarmTriggeredAt: null,
                missNotificationId: null,
              }
            : r
        );
        set({
          reminders: updatedReminders,
          filteredReminders: applyFilters(updatedReminders, filters),
        });

        // Notify child about miss
        if (childUserId) {
          await sendLocalNotification(
            '⏰ Reminder Missed',
            `${parentName} didn't respond to "${reminder.title}". It will ring again in ${rescheduleMinutes} minutes.`,
            { type: 'reminder_missed', reminderId }
          );
        }
      }
    } catch (error) {
      console.error('Failed to handle auto-miss:', error);
    }
  },

  // Check if reminder has timed out (for UI to determine if alarm screen should show)
  isReminderTimedOut: (reminderId: string) => {
    const { reminders } = get();
    const reminder = reminders.find((r) => r.id === reminderId);
    
    if (!reminder || !reminder.alarmTriggeredAt) {
      return false;
    }

    const TIMEOUT_MS = 60 * 1000; // 1 minute
    const triggerTime = reminder.alarmTriggeredAt.getTime();
    const now = Date.now();
    
    return now - triggerTime >= TIMEOUT_MS;
  },

  // Set filters
  setFilters: (newFilters: Partial<ReminderFilters>) => {
    const { reminders, filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    set({
      filters: updatedFilters,
      filteredReminders: applyFilters(reminders, updatedFilters),
    });
  },

  // Set selected reminder
  setSelectedReminder: (reminder: Reminder | null) => {
    set({ selectedReminder: reminder });
  },

  // Reset store
  reset: () => {
    set({
      reminders: [],
      filters: {
        searchQuery: '',
        label: 'all',
        status: 'all',
      },
      filteredReminders: [],
      selectedReminder: null,
      isLoading: false,
      error: null,
    });
  },
}));

