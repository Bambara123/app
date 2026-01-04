// src/stores/authStore.ts
// Authentication state management

import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { isDemoMode } from '../services/firebase/config';
import { User, UserRole } from '../types';

// Demo user for testing without Firebase
const DEMO_USER: User = {
  id: 'demo-user-123',
  name: 'Demo User',
  email: 'demo@eldercare.app',
  phone: '+1234567890',
  profileImageUrl: null,
  role: null,
  connectedTo: null,
  noteForPartner: null,
  customGreeting: null,
  batteryPercentage: 85,
  mood: 'happy',
  lastLocation: null,
  expoPushToken: null,
  lastInteraction: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface AuthState {
  // State
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (identityToken: string, nonce: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  // Demo mode
  demoSignIn: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  firebaseUser: null,
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  // Initialize auth listener
  initialize: () => {
    // In demo mode, just mark as initialized
    if (isDemoMode) {
      console.log('Running in demo mode - Firebase not configured');
      set({ isLoading: false, isInitialized: true });
      return () => {};
    }

    // Real Firebase initialization
    const initFirebase = async () => {
      try {
        const { onAuthStateChange } = await import('../services/firebase');
        const { userService } = await import('../services/firebase/firestore');
        const { registerForPushNotifications } = await import('../services/notifications');

        const unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
          set({ firebaseUser, isLoading: true });

          if (firebaseUser) {
            const user = await userService.getUser(firebaseUser.uid);
            set({ user, isLoading: false, isInitialized: true });

            const token = await registerForPushNotifications();
            if (token && user) {
              await userService.updatePushToken(user.id, token);
            }
          } else {
            set({ user: null, isLoading: false, isInitialized: true });
          }
        });

        return unsubscribeAuth;
      } catch (error) {
        console.warn('Firebase auth initialization failed:', error);
        set({ isLoading: false, isInitialized: true });
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

  // Demo sign in (for testing without Firebase)
  demoSignIn: () => {
    set({ user: DEMO_USER, isLoading: false, isInitialized: true });
  },

  // Google Sign In
  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithGoogle(idToken);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign in with Google',
        isLoading: false,
      });
      throw error;
    }
  },

  // Apple Sign In
  signInWithApple: async (identityToken: string, nonce: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithApple(identityToken, nonce);
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign in with Apple',
        isLoading: false,
      });
      throw error;
    }
  },

  // Sign Out
  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseSignOut();
      set({ user: null, firebaseUser: null, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign out',
        isLoading: false,
      });
      throw error;
    }
  },

  // Set user role
  setRole: async (role: UserRole) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      await userService.setRole(user.id, role);
      set({
        user: { ...user, role },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to set role',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update user profile
  updateUser: async (data: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      await userService.updateUser(user.id, data);
      set({
        user: { ...user, ...data },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

