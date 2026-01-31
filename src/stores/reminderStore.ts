// src/stores/reminderStore.ts
// Reminder state management
// Cloud Tasks notification system - uses callable functions for actions

import { create } from 'zustand';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../services/firebase/config';
import {
  Reminder,
  CreateReminderInput,
  ReminderFilters,
  ReminderFilterLabel,
  ReminderFilterStatus,
} from '../types';

// Initialize Firebase Functions with region
const functions = getFunctions(app, 'us-central1');

// Callable function for reminder actions
const handleReminderActionFn = httpsCallable<
  { reminderId: string; action: string; snoozeMinutes?: number },
  { success: boolean }
>(functions, 'handleReminderAction');

// 2 minutes timeout window for showing reminder screen
const REMINDER_WINDOW_MS = 2 * 60 * 1000;

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
  // Cloud Function handles task cancellation and child notification
  markAsDone: (reminderId: string) => Promise<void>;
  snooze: (reminderId: string, minutes?: number) => Promise<void>;
  markAsInProgress: (reminderId: string, followUpMinutes?: number) => Promise<void>;
  // Dismiss reminder on 2nd ring - marks as missed and notifies child
  dismiss: (reminderId: string) => Promise<void>;
  // Get active reminder that should show alarm screen (pending and within 2-min window)
  getActiveReminder: () => Reminder | null;
  // Check if reminder is within 2-min window (for showing alarm screen)
  isReminderActive: (reminderId: string) => boolean;
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
  // Cloud-only: No local notification scheduling - Cloud Functions handle all notifications
  initialize: (userId: string, isParent: boolean) => {
    set({ isLoading: true });

    const initFirebase = async () => {
      try {
        const { reminderService } = await import('../services/firebase/firestore');
        
        return reminderService.subscribeToReminders(
          userId,
          isParent,
          async (reminders) => {
            const { filters } = get();
            
            // Simply sync reminders from Firestore
            // Cloud Functions handle all notification sending
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
  // Cloud-only: Reminder is saved to Firestore, Cloud Function sends push at scheduled time
  createReminder: async (
    createdBy: string,
    forUser: string,
    input: CreateReminderInput
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');

      const reminder = await reminderService.createReminder(
        createdBy,
        forUser,
        input
      );

      // Cloud Function (checkDueReminders) will send push notification at scheduled time
      // No local notification scheduling needed
      set({ isLoading: false });
      return reminder;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create reminder',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update reminder
  // Cloud-only: Just update Firestore, Cloud Function handles notifications
  updateReminder: async (reminderId: string, data: Partial<Reminder>) => {
    set({ isLoading: true, error: null });

    try {
      const { reminderService } = await import('../services/firebase/firestore');

      // Reset serverNotificationSent if dateTime changed so cloud sends new notification
      if (data.dateTime) {
        await reminderService.updateReminder(reminderId, {
          ...data,
          serverNotificationSent: false,
        });
      } else {
        await reminderService.updateReminder(reminderId, data);
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
  // Uses Cloud Function to handle task cancellation and status update
  markAsDone: async (reminderId: string) => {
    set({ error: null });

    try {
      // Call Cloud Function to handle the action
      // This ensures timeout task is cancelled and child is notified
      await handleReminderActionFn({
        reminderId,
        action: 'done',
      });
    } catch (error: any) {
      console.error('Error marking as done:', error);
      set({ error: error.message || 'Failed to mark as done' });
      throw error;
    }
  },

  // Snooze reminder (only available on 1st ring)
  // Uses Cloud Function to cancel timeout task and reschedule
  snooze: async (reminderId: string, minutes = 10) => {
    set({ error: null });

    try {
      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);
      const snoozeMinutes = minutes || reminder?.followUpMinutes || 10;

      // Call Cloud Function to handle the action
      await handleReminderActionFn({
        reminderId,
        action: 'snooze',
        snoozeMinutes,
      });
    } catch (error: any) {
      console.error('Error snoozing:', error);
      set({ error: error.message || 'Failed to snooze' });
      throw error;
    }
  },

  // Mark reminder as in progress (parent clicked "I'm On It")
  // Uses Cloud Function to cancel timeout task and reschedule
  markAsInProgress: async (reminderId: string, followUpMinutes?: number) => {
    set({ error: null });

    try {
      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);
      const snoozeMinutes = followUpMinutes || reminder?.followUpMinutes || 10;

      // Call Cloud Function to handle the action
      await handleReminderActionFn({
        reminderId,
        action: 'im_on_it',
        snoozeMinutes,
      });
    } catch (error: any) {
      console.error('Error marking as in progress:', error);
      set({ error: error.message || 'Failed to mark as in progress' });
      throw error;
    }
  },

  // Dismiss reminder on 2nd ring - marks as missed and notifies child
  // Uses Cloud Function to handle status update and child notification
  dismiss: async (reminderId: string) => {
    set({ error: null });

    try {
      // Call Cloud Function to handle the action
      // This ensures child is notified and missed counter is incremented
      await handleReminderActionFn({
        reminderId,
        action: 'dismiss',
      });
    } catch (error: any) {
      console.error('Error dismissing:', error);
      set({ error: error.message || 'Failed to dismiss reminder' });
      throw error;
    }
  },

  // Get active reminder that should show alarm screen
  // Returns pending reminder that is within 2-min window of scheduled time
  getActiveReminder: () => {
    const { reminders } = get();
    const now = Date.now();

    return reminders.find((r) => {
      if (r.status !== 'pending') return false;
      
      const scheduledTime = r.dateTime.getTime();
      const timeSinceScheduled = now - scheduledTime;
      
      // Within 2-minute window (0 to 2 minutes after scheduled time)
      return timeSinceScheduled >= 0 && timeSinceScheduled < REMINDER_WINDOW_MS;
    }) || null;
  },

  // Check if a specific reminder is within the 2-min active window
  isReminderActive: (reminderId: string) => {
    const { reminders } = get();
    const reminder = reminders.find((r) => r.id === reminderId);
    
    if (!reminder || reminder.status !== 'pending') {
      return false;
    }

    const now = Date.now();
    const scheduledTime = reminder.dateTime.getTime();
    const timeSinceScheduled = now - scheduledTime;
    
    // Within 2-minute window
    return timeSinceScheduled >= 0 && timeSinceScheduled < REMINDER_WINDOW_MS;
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

