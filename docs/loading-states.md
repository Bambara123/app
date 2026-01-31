# Loading States & User Experience Optimization

## Overview

This document describes the loading state implementation across the app to ensure a smooth and responsive user experience.

## Loading Components

### 1. **Loading Spinner**
Simple animated spinner for general loading states.

```typescript
import { Loading } from '../../src/components/common';

<Loading size="large" text="Loading..." />
<Loading size="small" color={colors.primary[500]} />
<Loading fullScreen /> // Full screen overlay
```

### 2. **Skeleton Screens**
Placeholder components that mimic the layout of actual content.

```typescript
import { Skeleton, CardSkeleton, ReminderCardSkeleton, HomeCardSkeleton } from '../../src/components/common';

// Generic skeleton
<Skeleton width={200} height={20} borderRadius={8} />

// Pre-built skeletons
<CardSkeleton />
<ReminderCardSkeleton />
<HomeCardSkeleton />
```

### 3. **Loading Lists**
Multiple skeletons for list views.

```typescript
import { LoadingList } from '../../src/components/common';

<LoadingList count={5} type="reminder" />
<LoadingList count={3} type="home" />
<LoadingList count={4} type="card" />
```

## Implementation Strategy

### Initial Load States

All main screens now show skeleton screens during initial data load:

**Parent Home Screen:**
- Shows 4 home card skeletons while profile and partner data loads
- Replaces with actual content once data arrives

**Child Home Screen:**
- Shows 4 home card skeletons during initial load
- Smooth transition to actual content

**Reminder Screens (Parent & Child):**
- Shows 5 reminder card skeletons while reminders load
- Empty state shown if no reminders exist

### Pull-to-Refresh

All screens implement pull-to-refresh:

```typescript
const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefresh = useCallback(async () => {
  setIsRefreshing(true);
  try {
    // Reload data
    initUser(user.id);
  } catch (error) {
    console.error('Failed to refresh:', error);
  } finally {
    // Minimum 500ms for better UX
    setTimeout(() => setIsRefreshing(false), 500);
  }
}, [user?.id]);

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor={colors.primary[500]}
      colors={[colors.primary[500]]}
    />
  }
>
```

### Loading State Flow

```
┌─────────────────────────────────────────────────┐
│ User opens screen                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ isInitialLoad = true                            │
│ Show skeleton screens                           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Fetch data from Firestore                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Data loaded (profile/reminders)                 │
│ isLoading = false                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ isInitialLoad = false                           │
│ Show actual content                             │
└─────────────────────────────────────────────────┘
```

## Loading Timings

### Minimum Display Times
- **Skeleton screens**: 0ms (shows immediately if data not ready)
- **Pull-to-refresh spinner**: 500ms minimum for perceived responsiveness
- **Button loading**: No minimum (instant when action completes)

### Timeout Handling
- Network requests don't have explicit timeouts
- Firebase handles connection timeouts internally
- Firestore listeners automatically reconnect on network changes

## Screen-by-Screen Implementation

### Parent Home Screen
```typescript
// State
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);

// Loading tracking
useEffect(() => {
  if (profile && !userLoading && isInitialLoad) {
    setIsInitialLoad(false);
  }
}, [profile, userLoading]);

// Render
{isInitialLoad ? (
  <LoadingList count={4} type="home" />
) : (
  <>
    {/* Actual content */}
  </>
)}
```

### Child Home Screen
Same pattern as Parent Home Screen.

### Parent Reminders Screen
```typescript
// State
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);

// Loading tracking
useEffect(() => {
  if (!isLoading && isInitialLoad) {
    setIsInitialLoad(false);
  }
}, [isLoading]);

// Render
{isInitialLoad && isConnected ? (
  <LoadingList count={5} type="reminder" />
) : (
  <FlatList
    refreshControl={<RefreshControl ... />}
    ...
  />
)}
```

### Child Reminders Screen
Same pattern as Parent Reminders Screen.

## Benefits

### User Experience
✅ **No blank screens** - Always shows meaningful content or placeholders
✅ **Perceived performance** - Skeleton screens make app feel faster
✅ **Smooth transitions** - No jarring content jumps
✅ **Pull-to-refresh** - Users can manually reload data
✅ **Consistent patterns** - Same loading behavior across all screens

### Performance
✅ **Lazy evaluation** - Only load skeletons when needed
✅ **Minimal overhead** - Skeleton components are lightweight
✅ **No blocking** - UI remains responsive during data loads
✅ **Optimized re-renders** - Loading states prevent unnecessary updates

### Development
✅ **Reusable components** - Loading components work everywhere
✅ **Easy to maintain** - Centralized loading logic
✅ **TypeScript safe** - Full type checking for all loading states
✅ **Consistent patterns** - Same approach across all screens

## Future Enhancements

### Possible Improvements
- **Progressive loading**: Load critical data first, then secondary data
- **Optimistic updates**: Show changes immediately, sync in background
- **Offline support**: Cache data and show stale content while loading
- **Retry mechanisms**: Allow users to retry failed loads
- **Loading progress**: Show percentage for long operations
- **Shimmer animations**: Animated skeletons for more polished look

### Animation Enhancements
```typescript
// Could add shimmer effect to skeletons
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';

// Animated skeleton with shimmer
const shimmerAnimation = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.timing(shimmerAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    })
  ).start();
}, []);
```

## Testing Loading States

### How to Test
1. **Slow Network**: Use Network Link Conditioner (Mac) or Chrome DevTools
2. **Clear Cache**: Force initial load state by clearing app data
3. **Pull-to-refresh**: Test on all screens with actual device
4. **Long Operations**: Test reminder creation/deletion loading states

### Test Cases
- [ ] Initial app load shows skeletons
- [ ] Pull-to-refresh works on all list screens
- [ ] Skeleton → content transition is smooth
- [ ] Loading states clear after data loads
- [ ] Error states handled gracefully
- [ ] Offline → online transition works
- [ ] Multiple rapid refreshes don't break UI

## Performance Metrics

### Target Metrics
- **Time to Interactive (TTI)**: < 2 seconds
- **First Contentful Paint (FCP)**: < 1 second
- **Skeleton Display**: < 100ms
- **Content Transition**: < 300ms smooth fade

### Monitoring
Track these in production:
- Average initial load time
- Pull-to-refresh usage frequency
- Failed load rate
- User retry attempts

## Best Practices

### DO ✅
- Always show skeleton on initial load
- Use pull-to-refresh for manual updates
- Show loading indicators for user actions
- Handle error states gracefully
- Provide feedback for all interactions

### DON'T ❌
- Don't show endless spinners
- Don't block UI during loads
- Don't use blank screens
- Don't forget empty states
- Don't skip error handling

## Related Files

### Components
- `/src/components/common/Loading.tsx` - Loading components
- `/src/components/common/index.ts` - Exports

### Screens
- `/app/(parent)/index.tsx` - Parent home with loading
- `/app/(child)/index.tsx` - Child home with loading
- `/app/(parent)/reminders.tsx` - Parent reminders with loading
- `/app/(child)/reminders.tsx` - Child reminders with loading

### Stores
- `/src/stores/userStore.ts` - User loading state
- `/src/stores/reminderStore.ts` - Reminder loading state

---

**Last Updated**: 2026-01-31
**Version**: 1.0
