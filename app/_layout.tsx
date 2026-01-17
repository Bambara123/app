// app/_layout.tsx
// Root layout with auth provider and font loading

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore, useReminderStore, useUserStore } from '../src/stores';
import { setupNotificationListeners } from '../src/services/notifications';
import { colors } from '../src/constants';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized, user } = useAuthStore();
  const { handleAlarmTriggered, handleAutoMiss } = useReminderStore();
  const { profile } = useUserStore();
  const [appReady, setAppReady] = useState(false);

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

  // Setup notification listeners with reminder handlers
  useEffect(() => {
    const parentNickname = profile?.nickname || profile?.name || 'Your parent';
    
    const cleanup = setupNotificationListeners(
      // Handler when reminder notification is received (mark trigger time)
      async (reminderId: string) => {
        await handleAlarmTriggered(reminderId);
      },
      // Handler when auto-miss notification fires (1 minute timeout)
      async (reminderId: string) => {
        await handleAutoMiss(reminderId, user?.connectedTo, parentNickname);
      }
    );
    return cleanup;
  }, [user?.connectedTo, profile?.nickname, profile?.name]);

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

