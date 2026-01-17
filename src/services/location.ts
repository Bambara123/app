// src/services/location.ts
// Location monitoring service for parent device

import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import { GeoLocation } from '../types';

// Get current location with address
export const getCurrentLocation = async (): Promise<GeoLocation | null> => {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission not granted');
      return null;
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
        ]
          .filter(Boolean)
          .join(', ');
      }
    } catch (e) {
      console.log('Geocoding failed:', e);
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      address,
      timestamp: new Date(),
    };
  } catch (error) {
    console.log('Error getting location:', error);
    return null;
  }
};

// Start location monitoring and update Firebase
export const startLocationMonitoring = (
  userId: string,
  onUpdate?: (location: GeoLocation) => void
): (() => void) => {
  let isActive = true;

  const updateLocation = async () => {
    if (!isActive) return;

    try {
      // Check permission status without showing dialog
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      
      // Only request if not determined yet, skip if denied
      if (status === ExpoLocation.PermissionStatus.UNDETERMINED) {
        const { status: newStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Location permission not granted');
          return;
        }
      } else if (status !== 'granted') {
        console.log('Location permission was denied');
        return;
      }

      const location = await getCurrentLocation();
      
      if (location) {
        // Update Firebase with the location
        const { userService } = await import('./firebase/firestore');
        await userService.updateUserLocation(userId, location);
        
        if (onUpdate) {
          onUpdate(location);
        }
        
        console.log('Location updated:', location.address || `${location.latitude}, ${location.longitude}`);
      }
    } catch (error) {
      console.log('Error updating location:', error);
    }
  };

  // Initial update with small delay to avoid blocking UI
  setTimeout(updateLocation, 1000);

  // Set up interval to check every 5 minutes
  const interval = setInterval(updateLocation, 5 * 60 * 1000);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(interval);
  };
};

// Request location permissions
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Error requesting location permissions:', error);
    return false;
  }
};


