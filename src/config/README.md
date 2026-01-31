# Feature Flags Configuration

## Overview

This folder contains feature flag configurations that allow you to enable/disable app features without changing code.

## Usage

### Enabling/Disabling Features

Edit `features.ts` and set the feature flags to `true` or `false`:

```typescript
export const FEATURES = {
  LOCATION_TRACKING: false,    // ← Set to true to enable
  BATTERY_MONITORING: false,   // ← Set to true to enable
  EMERGENCY_ALERTS: false,     // ← Set to true to enable
} as const;
```

### Available Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `LOCATION_TRACKING` | Track and display parent's location on child's device | `false` |
| `BATTERY_MONITORING` | Monitor and display battery levels | `false` |
| `EMERGENCY_ALERTS` | Emergency alert button for parent to notify child | `false` |

### Impact of Disabling Features

#### `LOCATION_TRACKING: false`
- ❌ Location monitoring stopped on parent's device
- ❌ Location not sent to Firestore
- ❌ "View location" button hidden on child's device
- ❌ Map functionality disabled

#### `BATTERY_MONITORING: false`
- ❌ Battery monitoring stopped on parent's device
- ❌ Battery level not sent to Firestore
- ❌ Battery card hidden on both parent and child devices
- ❌ Low battery alerts disabled

#### `EMERGENCY_ALERTS: false`
- ❌ Emergency button hidden on parent's device
- ❌ Emergency notifications disabled for child
- ❌ Emergency alert modal won't show

### When to Enable Features

**Enable later when:**
- You're ready to implement full location tracking
- You want to monitor device health (battery)
- You need emergency communication features

**Keep disabled if:**
- Privacy concerns about location tracking
- Battery monitoring not relevant for your use case
- Emergency alerts not needed yet

## Examples

### Production (All Features On)
```typescript
export const FEATURES = {
  LOCATION_TRACKING: true,
  BATTERY_MONITORING: true,
  EMERGENCY_ALERTS: true,
};
```

### Development (Test Reminders Only)
```typescript
export const FEATURES = {
  LOCATION_TRACKING: false,
  BATTERY_MONITORING: false,
  EMERGENCY_ALERTS: false,
};
```

### Partial Rollout (Battery Only)
```typescript
export const FEATURES = {
  LOCATION_TRACKING: false,
  BATTERY_MONITORING: true,
  EMERGENCY_ALERTS: false,
};
```

## Adding New Features

To add a new feature flag:

1. Add to `features.ts`:
```typescript
export const FEATURES = {
  // ... existing features
  VIDEO_CALLS: false,  // ← New feature
} as const;
```

2. Use in your components:
```typescript
import { FEATURES } from '../../config/features';

if (FEATURES.VIDEO_CALLS) {
  // Show video call button
}
```

## Notes

- ✅ Changes take effect immediately after app restart
- ✅ No need to rebuild the app for config changes
- ✅ Type-safe with TypeScript
- ⚠️ Features are disabled by default for safety
