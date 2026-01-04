// src/stores/userStore.ts
// User profile and partner state management

import { create } from 'zustand';
import { isDemoMode } from '../services/firebase/config';
import { User, PartnerStatus, Connection } from '../types';

// Demo partner for testing
const DEMO_PARTNER: PartnerStatus = {
  id: 'demo-partner-456',
  name: 'Mom',
  phone: '+1987654321',
  profileImageUrl: null,
  batteryPercentage: 72,
  mood: 'happy',
  lastLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: new Date(),
    address: '123 Main Street, San Francisco, CA',
  },
  lastInteraction: new Date(),
  isOnline: true,
  noteForPartner: 'Had a great breakfast today! 🥞',
  customGreeting: 'Good Morning, sweetie!',
};

const DEMO_CONNECTION: Connection = {
  id: 'demo-connection-789',
  parentId: 'demo-partner-456',
  childId: 'demo-user-123',
  initiatedBy: 'demo-user-123',
  status: 'active',
  connectedAt: new Date(),
  updatedAt: new Date(),
};

interface UserState {
  // State
  profile: User | null;
  partner: PartnerStatus | null;
  connection: Connection | null;
  partnerNote: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: (userId: string) => () => void;
  loadPartner: (partnerId: string) => Promise<void>;
  connectToPartner: (partnerId: string, myRole: 'parent' | 'child') => Promise<void>;
  updateNote: (note: string) => Promise<void>;
  updateGreeting: (greeting: string) => Promise<void>;
  setDemoData: (user: User) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  profile: null,
  partner: null,
  connection: null,
  partnerNote: null,
  isLoading: false,
  error: null,

  // Set demo data for testing
  setDemoData: (user: User) => {
    set({
      profile: user,
      partner: DEMO_PARTNER,
      connection: DEMO_CONNECTION,
      partnerNote: DEMO_PARTNER.noteForPartner,
      isLoading: false,
    });
  },

  // Initialize user data and subscriptions
  initialize: (userId: string) => {
    // In demo mode, use demo data
    if (isDemoMode) {
      set({
        partner: DEMO_PARTNER,
        connection: DEMO_CONNECTION,
        partnerNote: DEMO_PARTNER.noteForPartner,
        isLoading: false,
      });
      return () => {};
    }

    let unsubscribeUser: (() => void) | null = null;

    const setup = async () => {
      set({ isLoading: true });

      try {
        const { userService, connectionService } = await import('../services/firebase/firestore');

        // Subscribe to user profile
        unsubscribeUser = userService.subscribeToUser(userId, async (user) => {
          set({ profile: user });

          if (user?.connectedTo) {
            const { loadPartner } = get();
            await loadPartner(user.connectedTo);
          }
        });

        // Find existing connection
        const connection = await connectionService.findConnectionByUser(userId);
        set({ connection, isLoading: false });
      } catch (error) {
        console.warn('Failed to initialize user store:', error);
        set({ isLoading: false });
      }
    };

    setup();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  },

  // Load partner data
  loadPartner: async (partnerId: string) => {
    if (isDemoMode) {
      set({
        partner: DEMO_PARTNER,
        partnerNote: DEMO_PARTNER.noteForPartner,
      });
      return;
    }

    try {
      const { userService } = await import('../services/firebase/firestore');
      const partnerUser = await userService.getUser(partnerId);
      
      if (partnerUser) {
        const now = new Date();
        const lastInteraction = new Date(partnerUser.lastInteraction);
        const minutesSinceLastInteraction =
          (now.getTime() - lastInteraction.getTime()) / 1000 / 60;
        
        const partnerStatus: PartnerStatus = {
          id: partnerUser.id,
          name: partnerUser.name,
          phone: partnerUser.phone,
          profileImageUrl: partnerUser.profileImageUrl,
          batteryPercentage: partnerUser.batteryPercentage,
          mood: partnerUser.mood,
          lastLocation: partnerUser.lastLocation,
          lastInteraction: partnerUser.lastInteraction,
          isOnline: minutesSinceLastInteraction < 5,
          noteForPartner: partnerUser.noteForPartner,
          customGreeting: partnerUser.customGreeting,
        };

        set({
          partner: partnerStatus,
          partnerNote: partnerUser.noteForPartner,
        });
      }
    } catch (error) {
      console.warn('Failed to load partner:', error);
    }
  },

  // Connect to partner
  connectToPartner: async (partnerId: string, myRole: 'parent' | 'child') => {
    const { profile } = get();
    if (!profile) return;

    if (isDemoMode) {
      set({
        connection: DEMO_CONNECTION,
        partner: DEMO_PARTNER,
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { userService, connectionService } = await import('../services/firebase/firestore');

      const partnerUser = await userService.getUser(partnerId);
      if (!partnerUser) {
        throw new Error('Partner not found');
      }

      const parentId = myRole === 'parent' ? profile.id : partnerId;
      const childId = myRole === 'child' ? profile.id : partnerId;

      const connection = await connectionService.createConnection(
        parentId,
        childId,
        profile.id
      );

      set({ connection, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to connect',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update note for partner
  updateNote: async (note: string) => {
    const { profile } = get();
    if (!profile) return;

    if (isDemoMode) {
      set({ profile: { ...profile, noteForPartner: note } });
      return;
    }

    try {
      const { userService } = await import('../services/firebase/firestore');
      await userService.updateUser(profile.id, { noteForPartner: note });
      set({ profile: { ...profile, noteForPartner: note } });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update note' });
      throw error;
    }
  },

  // Update custom greeting (child only)
  updateGreeting: async (greeting: string) => {
    const { profile } = get();
    if (!profile) return;

    if (isDemoMode) {
      set({ profile: { ...profile, customGreeting: greeting } });
      return;
    }

    try {
      const { userService } = await import('../services/firebase/firestore');
      await userService.updateUser(profile.id, { customGreeting: greeting });
      set({ profile: { ...profile, customGreeting: greeting } });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update greeting' });
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      profile: null,
      partner: null,
      connection: null,
      partnerNote: null,
      isLoading: false,
      error: null,
    });
  },
}));
