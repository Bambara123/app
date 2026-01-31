// src/config/features.ts
// Feature flags for enabling/disabling app features

/**
 * Feature flags configuration
 * Set to true to enable, false to disable
 */
export const FEATURES = {
  // Location tracking and monitoring
  LOCATION_TRACKING: false,
  
  // Battery level monitoring and display
  BATTERY_MONITORING: false,
  
  // Emergency alert button and functionality
  EMERGENCY_ALERTS: false,
  
  // Future features can be added here
  // Example:
  // VIDEO_CALLS: false,
  // MEDICATION_REMINDERS: true,
} as const;

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature];
};
