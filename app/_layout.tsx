// app/_layout.tsx
// Root layout with auth provider and font loading
// Cloud-only notification system - no local notification scheduling

import { useEffect, useState, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { useAuthStore, useUserStore } from '../src/stores';
import { setupNotificationListeners } from '../src/services/notifications';
import { colors } from '../src/constants';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized, user } = useAuthStore();
  const { profile } = useUserStore();
  const [appReady, setAppReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const hasShownModalOnForeground = useRef(false);
  // Track if we've shown the missed reminders popup for current missedReminders count
  const lastShownMissedCount = useRef(0);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay: PlayfairDisplay_400Regular,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
  });

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // Setup notification listeners (simplified - just handles navigation)
  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // Show missed reminders alert when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App came to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user?.role === 'parent' &&
        !hasShownModalOnForeground.current
      ) {
        // Check for missed reminders count from user profile
        const missedCount = profile?.missedReminders || 0;
        
        // Only show if count increased since last time we showed
        if (missedCount > 0 && missedCount > lastShownMissedCount.current) {
          hasShownModalOnForeground.current = true;
          lastShownMissedCount.current = missedCount;
          
          // Show missed reminders popup
          setTimeout(() => {
            router.push({
              pathname: '/modals/missed-reminders-alert',
              params: { count: missedCount.toString() },
            });
            // Reset flag after navigation
            setTimeout(() => {
              hasShownModalOnForeground.current = false;
            }, 1000);
          }, 500);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.role, profile?.missedReminders]);

  // Cloud-only notification system: No sync push handling needed
  // Cloud Functions send push notifications at the scheduled time
  // The setupNotificationListeners handles opening the alarm modal when push arrives

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      setAppReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(child)" />
        <Stack.Screen
          name="modals/reminder-alarm"
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modals/emergency-alert"
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modals/settings"
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="modals/create-reminder"
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="modals/missed-reminders-alert"
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});

