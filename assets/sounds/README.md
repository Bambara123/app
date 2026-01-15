# Alarm Sounds

This folder contains custom notification sounds for the app.

## Required Files

### `reminder.wav`
- **Purpose**: Plays when a reminder notification is triggered
- **Duration**: Maximum 30 seconds (iOS limitation)
- **Format**: `.wav`, `.caf`, or `.aiff` for iOS; `.wav` or `.mp3` for Android
- **Recommendation**: Use a loud, attention-grabbing alarm sound

## How to Add Your Sound

1. Download or create an alarm sound file (max 30 seconds)
2. Rename it to `reminder.wav`
3. Place it in this folder (`assets/sounds/`)
4. Rebuild the app with `eas build`

## Free Alarm Sound Resources

- [Freesound.org](https://freesound.org/search/?q=alarm) - Free creative commons sounds
- [Mixkit](https://mixkit.co/free-sound-effects/alarm/) - Free alarm sounds
- [Zapsplat](https://www.zapsplat.com/sound-effect-category/alarm-sounds/) - Free alarm sounds

## Note

Custom sounds require a **production build** (not Expo Go).
The sound will not work in Expo Go - you must build with:

```bash
eas build --platform ios
# or
eas build --platform android
```

After adding the sound file, the notification will play this sound for up to 30 seconds when a reminder is triggered.

