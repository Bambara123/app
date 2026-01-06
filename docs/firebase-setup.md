# Firebase & Cloud Configuration Guide

Step-by-step guide to set up Firebase and cloud services for ElderCare.

---

## Prerequisites

- Google account
- Apple Developer account (for iOS deployment)
- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `eldercare` (or your preferred name)
4. Enable/disable Google Analytics (optional)
5. Click **"Create Project"**
6. Wait for project creation to complete

---

## Step 2: Register iOS App

1. In Firebase Console, click the **iOS icon** to add an iOS app
2. Enter the following:
   - **Bundle ID:** `com.yourcompany.eldercare` (must match your Expo app.json)
   - **App nickname:** `ElderCare iOS`
   - **App Store ID:** (leave blank for now)
3. Click **"Register app"**
4. Download `GoogleService-Info.plist` (save for later)
5. Click **"Continue"** through remaining steps

---

## Step 3: Enable Authentication

1. In Firebase Console sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable the following providers:

### Google Sign-In
1. Click **"Google"**
2. Toggle **"Enable"**
3. Set **Support email** to your email
4. Click **"Save"**

### Apple Sign-In
1. Click **"Apple"**
2. Toggle **"Enable"**
3. Click **"Save"**
4. Note: You'll need to configure Apple Developer account later

---

## Step 4: Create Firestore Database

1. In Firebase Console sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add rules later)
4. Choose a location closest to your users (e.g., `us-central1`)
5. Click **"Enable"**

### Set Firestore Rules
1. Go to **"Rules"** tab
2. Replace with the rules from `docs/database-schema.md`
3. Click **"Publish"**

---

## Step 5: Enable Firebase Storage

1. In Firebase Console sidebar, click **"Storage"**
2. Click **"Get started"**
3. Click **"Start in production mode"**
4. Click **"Next"**, then **"Done"**

### Set Storage Rules
1. Go to **"Rules"** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /chat/{chatRoomId}/{fileName} {
      allow read, write: if request.auth != null;
    }
    match /voice/{chatRoomId}/{fileName} {
      allow read, write: if request.auth != null;
    }
    match /album/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 6: Set Up Cloud Functions

1. Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Functions in your project root:
```bash
firebase init functions
```

4. Select options:
   - **Use an existing project:** Select your `eldercare` project
   - **Language:** TypeScript
   - **ESLint:** Yes
   - **Install dependencies:** Yes

5. The `functions/` folder will be created

---

## Step 7: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Select your iOS app
4. Under **"SDK setup and configuration"**, select **"Config"**
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "eldercare-xxxxx.firebaseapp.com",
  projectId: "eldercare-xxxxx",
  storageBucket: "eldercare-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:ios:abc123"
};
```

6. Create `.env` file in your project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=eldercare-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=eldercare-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=eldercare-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:ios:abc123
```

---

## Step 8: Configure Apple Sign-In (Apple Developer)

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign in with your Apple Developer account

### Create App ID
1. Go to **"Certificates, Identifiers & Profiles"**
2. Click **"Identifiers"** → **"+"** → **"App IDs"**
3. Select **"App"** → **"Continue"**
4. Enter:
   - **Description:** ElderCare
   - **Bundle ID:** `com.yourcompany.eldercare` (same as Firebase)
5. Under **"Capabilities"**, check **"Sign In with Apple"**
6. Click **"Continue"** → **"Register"**

### Create Service ID (for Firebase)
1. Click **"+"** → **"Services IDs"** → **"Continue"**
2. Enter:
   - **Description:** ElderCare Web Auth
   - **Identifier:** `com.yourcompany.eldercare.auth`
3. Click **"Continue"** → **"Register"**
4. Click on the Service ID you created
5. Enable **"Sign In with Apple"**
6. Click **"Configure"**
7. For **"Domains and Subdomains"**, add:
   - `eldercare-xxxxx.firebaseapp.com` (your Firebase auth domain)
8. For **"Return URLs"**, add:
   - `https://eldercare-xxxxx.firebaseapp.com/__/auth/handler`
9. Click **"Save"** → **"Continue"** → **"Save"**

### Create Key for Apple Sign-In
1. Go to **"Keys"** → **"+"**
2. Enter:
   - **Key Name:** ElderCare Sign In Key
3. Check **"Sign In with Apple"**
4. Click **"Configure"** → Select your App ID → **"Save"**
5. Click **"Continue"** → **"Register"**
6. Download the `.p8` key file (save securely!)
7. Note your **Key ID**

### Update Firebase with Apple Credentials
1. Go to Firebase Console → **Authentication** → **Sign-in method** → **Apple**
2. Expand **"OAuth code flow configuration (optional)"**
3. Enter:
   - **Services ID:** `com.yourcompany.eldercare.auth`
   - **Apple Team ID:** (from Apple Developer account)
   - **Key ID:** (from the key you created)
   - **Private Key:** (paste contents of `.p8` file)
4. Click **"Save"**

---

## Step 9: Configure Google Sign-In (iOS)

1. In Firebase Console → **Project Settings** → **Your apps**
2. Download `GoogleService-Info.plist` if you haven't
3. Note the `REVERSED_CLIENT_ID` value from the plist

### Add URL Scheme to Expo
In your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.eldercare",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID"
            ]
          }
        ]
      }
    }
  }
}
```

---

## Step 10: Set Up Expo Push Notifications

1. Create an Expo account at [expo.dev](https://expo.dev/)
2. Login via CLI:
```bash
npx expo login
```

3. Get your Expo project ID:
```bash
npx expo whoami
```

4. Add to your `.env`:
```env
EXPO_PUBLIC_EXPO_PROJECT_ID=your-expo-project-id
```

### Configure Push Notifications for iOS
1. In Apple Developer Portal, go to **"Keys"**
2. Create a new key with **"Apple Push Notifications service (APNs)"** enabled
3. Download the `.p8` file
4. In Expo Dashboard → Your Project → **"Credentials"**
5. Select iOS → Upload your APNs key

---

## Step 11: Create Firestore Indexes

Run your app and execute queries. Firebase will provide links to create required indexes, or create them manually:

1. Go to Firebase Console → **Firestore** → **"Indexes"**
2. Click **"Add Index"** for each:

| Collection | Fields | Query Scope |
|------------|--------|-------------|
| `reminders` | `forUser` (Asc), `dateTime` (Asc) | Collection |
| `reminders` | `forUser` (Asc), `status` (Asc), `dateTime` (Asc) | Collection |
| `reminders` | `createdBy` (Asc), `createdAt` (Desc) | Collection |
| `connections` | `parentId` (Asc), `status` (Asc) | Collection |
| `connections` | `childId` (Asc), `status` (Asc) | Collection |
| `albumImages` | `connectionId` (Asc), `createdAt` (Desc) | Collection |
| `locations` | `userId` (Asc), `timestamp` (Desc) | Collection |
| `emergencyAlerts` | `notifyUser` (Asc), `status` (Asc), `createdAt` (Desc) | Collection |

---

## Step 12: Deploy Cloud Functions

1. Navigate to functions folder:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

3. Build and deploy:
```bash
npm run deploy
```

Or from project root:
```bash
firebase deploy --only functions
```

---

## Verification Checklist

Before proceeding with development, verify:

- [ ] Firebase project created
- [ ] iOS app registered in Firebase
- [ ] Google Sign-In enabled
- [ ] Apple Sign-In enabled
- [ ] Firestore database created
- [ ] Firestore security rules published
- [ ] Storage enabled
- [ ] Storage security rules published
- [ ] Cloud Functions initialized
- [ ] `.env` file created with all Firebase config
- [ ] Apple Developer App ID created with Sign In with Apple
- [ ] Apple Service ID created and configured
- [ ] Apple Sign-In key created and uploaded to Firebase
- [ ] Google Sign-In URL schemes configured
- [ ] Expo account created and logged in
- [ ] APNs key uploaded to Expo
- [ ] Firestore indexes created

---

## Quick Reference - Environment Variables

Your final `.env` file should contain:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Expo
EXPO_PUBLIC_EXPO_PROJECT_ID=your_expo_project_id

# Google Sign-In (iOS)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

---

## Troubleshooting

### Google Sign-In not working
- Verify URL schemes in `app.json`
- Check `REVERSED_CLIENT_ID` is correct
- Ensure Google provider is enabled in Firebase Auth

### Apple Sign-In not working
- Verify Service ID matches Firebase config
- Check return URL is correct
- Ensure key is not expired

### Firestore permission denied
- Check security rules are published
- Verify user is authenticated
- Check if required indexes exist

### Push notifications not received
- Verify APNs key is uploaded to Expo
- Check `expoPushToken` is stored in user document
- Test with Expo Push Tool: https://expo.dev/notifications

---

## Next Steps

Once all configuration is complete, tell me and I'll start implementing the React Native code!

