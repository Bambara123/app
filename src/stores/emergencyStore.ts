// src/stores/emergencyStore.ts
// Emergency alert state management

import { create } from 'zustand';
import { EmergencyAlert, Location } from '../types';

interface EmergencyState {
  // State
  activeAlerts: EmergencyAlert[];
  isTriggering: boolean;
  currentLocation: Location | null;
  error: string | null;

  // Actions
  initialize: (userId: string) => () => void;
  triggerEmergency: (userId: string, notifyUserId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  getCurrentLocation: () => Promise<Location | null>;
  reset: () => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  // Initial state
  activeAlerts: [],
  isTriggering: false,
  currentLocation: null,
  error: null,

  // Initialize emergency alerts subscription
  initialize: (userId: string) => {
    const initFirebase = async () => {
      try {
        const { emergencyService } = await import('../services/firebase/firestore');
        return emergencyService.subscribeToAlerts(userId, (alerts) => {
          set({ activeAlerts: alerts });
        });
      } catch (error) {
        console.error('Failed to initialize emergency store:', error);
        set({ error: 'Failed to load emergency alerts' });
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

  // Trigger emergency alert
  triggerEmergency: async (userId: string, notifyUserId: string) => {
    set({ isTriggering: true, error: null });

    try {
      // Check for existing active alert first
      const { emergencyService } = await import('../services/firebase/firestore');
      const hasActive = await emergencyService.hasActiveAlert(userId);
      if (hasActive) {
        set({ isTriggering: false });
        throw new Error('You already have an active emergency alert. Please wait for your child to acknowledge it before sending another.');
      }

      const location = await get().getCurrentLocation();

      await emergencyService.triggerEmergency(userId, notifyUserId, location);
      set({ isTriggering: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to trigger emergency',
        isTriggering: false,
      });
      throw error;
    }
  },

  // Acknowledge alert (child receives it)
  acknowledgeAlert: async (alertId: string) => {
    try {
      const { emergencyService } = await import('../services/firebase/firestore');
      await emergencyService.acknowledgeAlert(alertId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to acknowledge alert' });
      throw error;
    }
  },

  // Resolve alert (mark as handled)
  resolveAlert: async (alertId: string) => {
    try {
      const { emergencyService } = await import('../services/firebase/firestore');
      await emergencyService.resolveAlert(alertId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to resolve alert' });
      throw error;
    }
  },

  // Get current location
  getCurrentLocation: async (): Promise<Location | null> => {
    try {
      const ExpoLocation = await import('expo-location');

      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Demo fallback location
        const fallbackLocation: Location = {
          id: '',
          userId: '',
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
          address: 'Demo Location, San Francisco, CA',
          timestamp: new Date(),
        };
        set({ currentLocation: fallbackLocation });
        return fallbackLocation;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      let address: string | null = null;
      try {
        const [geocode] = await ExpoLocation.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode) {
          address = [
            geocode.street,
            geocode.city,
            geocode.region,
            geocode.country,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (e) {
        console.log('Geocoding failed:', e);
      }

      const currentLocation: Location = {
        id: '',
        userId: '',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        address,
        timestamp: new Date(),
      };

      set({ currentLocation });
      return currentLocation;
    } catch (error) {
      console.error('Location error:', error);
      // Fallback for demo
      const fallbackLocation: Location = {
        id: '',
        userId: '',
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        address: 'Demo Location, San Francisco, CA',
        timestamp: new Date(),
      };
      set({ currentLocation: fallbackLocation });
      return fallbackLocation;
    }
  },

  // Reset store
  reset: () => {
    set({
      activeAlerts: [],
      isTriggering: false,
      currentLocation: null,
      error: null,
    });
  },
}));
