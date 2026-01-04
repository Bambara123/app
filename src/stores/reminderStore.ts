// src/stores/reminderStore.ts
// Reminder state management

import { create } from 'zustand';
import { isDemoMode } from '../services/firebase/config';
import {
  Reminder,
  CreateReminderInput,
  ReminderFilters,
  ReminderFilterLabel,
  ReminderFilterStatus,
} from '../types';

// Demo reminders for testing
const DEMO_REMINDERS: Reminder[] = [
  {
    id: 'demo-reminder-1',
    createdBy: 'demo-user-123',
    forUser: 'demo-partner-456',
    title: 'Take morning medicine',
    description: 'Blood pressure pills with breakfast',
    dateTime: new Date(Date.now() + 30 * 60 * 1000), // 30 min from now
    repeat: 'daily',
    customRepeat: null,
    label: 'medicine',
    icon: 'medical',
    status: 'pending',
    completedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    customAlarmAudioUrl: null,
    followUpMinutes: 10,
    notificationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-reminder-2',
    createdBy: 'demo-user-123',
    forUser: 'demo-partner-456',
    title: 'Lunch time',
    description: 'Have a healthy meal',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    repeat: 'daily',
    customRepeat: null,
    label: 'meal',
    icon: 'restaurant',
    status: 'pending',
    completedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    customAlarmAudioUrl: null,
    followUpMinutes: 10,
    notificationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-reminder-3',
    createdBy: 'demo-user-123',
    forUser: 'demo-partner-456',
    title: 'Doctor appointment',
    description: 'Annual checkup at City Hospital',
    dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    repeat: 'none',
    customRepeat: null,
    label: 'doctor',
    icon: 'medkit',
    status: 'pending',
    completedAt: null,
    snoozedUntil: null,
    snoozeCount: 0,
    customAlarmAudioUrl: null,
    followUpMinutes: 10,
    notificationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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
  markAsDone: (reminderId: string) => Promise<void>;
  snooze: (reminderId: string, minutes?: number) => Promise<void>;
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
    // Demo mode - use demo reminders
    if (isDemoMode) {
      const { filters } = get();
      set({
        reminders: DEMO_REMINDERS,
        filteredReminders: applyFilters(DEMO_REMINDERS, filters),
        isLoading: false,
      });
      return () => {};
    }

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
        console.warn('Failed to initialize reminders:', error);
        set({ isLoading: false });
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

    // Demo mode - add to local list
    if (isDemoMode) {
      const newReminder: Reminder = {
        id: `demo-reminder-${Date.now()}`,
        createdBy,
        forUser,
        ...input,
        status: 'pending',
        completedAt: null,
        snoozedUntil: null,
        snoozeCount: 0,
        notificationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const { reminders, filters } = get();
      const newReminders = [newReminder, ...reminders];
      set({
        reminders: newReminders,
        filteredReminders: applyFilters(newReminders, filters),
        isLoading: false,
      });
      return newReminder;
    }

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

    if (isDemoMode) {
      const { reminders, filters } = get();
      const newReminders = reminders.map((r) =>
        r.id === reminderId ? { ...r, ...data, updatedAt: new Date() } : r
      );
      set({
        reminders: newReminders,
        filteredReminders: applyFilters(newReminders, filters),
        isLoading: false,
      });
      return;
    }

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

    if (isDemoMode) {
      const { reminders, filters } = get();
      const newReminders = reminders.filter((r) => r.id !== reminderId);
      set({
        reminders: newReminders,
        filteredReminders: applyFilters(newReminders, filters),
        isLoading: false,
      });
      return;
    }

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
  markAsDone: async (reminderId: string) => {
    set({ error: null });

    if (isDemoMode) {
      const { reminders, filters } = get();
      const newReminders = reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'completed' as const, completedAt: new Date() }
          : r
      );
      set({
        reminders: newReminders,
        filteredReminders: applyFilters(newReminders, filters),
      });
      return;
    }

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { cancelNotification } = await import('../services/notifications');

      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      await reminderService.markAsDone(reminderId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark as done' });
      throw error;
    }
  },

  // Snooze reminder
  snooze: async (reminderId: string, minutes = 10) => {
    set({ error: null });

    if (isDemoMode) {
      const { reminders, filters } = get();
      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      const newReminders = reminders.map((r) =>
        r.id === reminderId
          ? { ...r, status: 'snoozed' as const, snoozedUntil, snoozeCount: r.snoozeCount + 1 }
          : r
      );
      set({
        reminders: newReminders,
        filteredReminders: applyFilters(newReminders, filters),
      });
      return;
    }

    try {
      const { reminderService } = await import('../services/firebase/firestore');
      const { scheduleReminderNotification, cancelNotification } = await import('../services/notifications');

      const { reminders } = get();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (reminder?.notificationId) {
        await cancelNotification(reminder.notificationId);
      }

      await reminderService.snooze(reminderId, minutes);

      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      const notificationId = await scheduleReminderNotification(
        reminderId,
        reminder?.title || 'Reminder',
        `Snoozed reminder: ${reminder?.description || 'Time for your reminder!'}`,
        snoozedUntil
      );

      await reminderService.updateReminder(reminderId, { notificationId });
    } catch (error: any) {
      set({ error: error.message || 'Failed to snooze' });
      throw error;
    }
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

