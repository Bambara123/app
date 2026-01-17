// src/services/battery.ts
// Battery monitoring service for parent device

import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

export interface BatteryStatus {
  level: number; // 0-100
  isCharging: boolean;
}

// Get current battery level
export const getBatteryLevel = async (): Promise<number> => {
  try {
    const level = await Battery.getBatteryLevelAsync();
    return Math.round(level * 100);
  } catch (error) {
    console.log('Error getting battery level:', error);
    return -1;
  }
};

// Get battery state (charging, etc.)
export const getBatteryState = async (): Promise<Battery.BatteryState> => {
  try {
    return await Battery.getBatteryStateAsync();
  } catch (error) {
    console.log('Error getting battery state:', error);
    return Battery.BatteryState.UNKNOWN;
  }
};

// Get full battery status
export const getBatteryStatus = async (): Promise<BatteryStatus> => {
  try {
    const level = await getBatteryLevel();
    const state = await getBatteryState();
    const isCharging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
    
    return { level, isCharging };
  } catch (error) {
    console.log('Error getting battery status:', error);
    return { level: -1, isCharging: false };
  }
};

// Start battery level monitoring and update Firebase
export const startBatteryMonitoring = (
  userId: string,
  onUpdate?: (level: number) => void
): (() => void) => {
  let isActive = true;
  let lastLevel = -1;

  const updateBattery = async () => {
    if (!isActive) return;

    try {
      const level = await getBatteryLevel();
      
      // Only update if level changed significantly (2% or more)
      if (lastLevel === -1 || Math.abs(level - lastLevel) >= 2) {
        lastLevel = level;
        
        // Update Firebase
        const { userService } = await import('./firebase/firestore');
        await userService.updateUser(userId, { batteryPercentage: level });
        
        if (onUpdate) {
          onUpdate(level);
        }
        
        console.log(`Battery level updated: ${level}%`);
      }
    } catch (error) {
      console.log('Error updating battery:', error);
    }
  };

  // Delay initial update to avoid blocking UI on load
  setTimeout(updateBattery, 2000);

  // Set up interval to check every 5 minutes
  const interval = setInterval(updateBattery, 5 * 60 * 1000);

  // Subscribe to battery level changes
  let subscription: Battery.Subscription | null = null;
  
  if (Platform.OS !== 'web') {
    subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const level = Math.round(batteryLevel * 100);
      if (Math.abs(level - lastLevel) >= 2) {
        updateBattery();
      }
    });
  }

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(interval);
    if (subscription) {
      subscription.remove();
    }
  };
};

// Request necessary permissions (if needed in future)
export const requestBatteryPermissions = async (): Promise<boolean> => {
  // expo-battery doesn't require explicit permissions
  // but this function can be extended if needed
  return true;
};

