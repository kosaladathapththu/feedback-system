# Supun Feedback Management System

Responsive QR-based guest feedback and management application built with React, Vite, Firebase, and Recharts.

## Current increment

- Public route at `/f/:locationCode` resolves an active Firestore location.
- Four-step, zone-aware, validated feedback form with a private thank-you receipt.
- Firebase Authentication login and protected `/manage` route.
- Firestore rules that prevent public feedback reads and validate public submissions.
- Responsive hospitality design based on the supplied prototype.

## Setup

1. Install Node.js 20 or newer and run `npm install`.
2. Copy `.env.example` to `.env` and enter the Firebase web-app configuration.
3. In Firebase Console, enable Email/Password Authentication, Firestore, and Hosting.
4. Create a location document such as:

```json
{"code":"APT-12","name":"Apartment 12","zone":"apartment","floor":"1","active":true}
```

5. Run `npm run dev`, then open `http://localhost:5173/f/APT-12`.

## Initial administrator

Create the first user in Firebase Authentication. In Firestore, create `users/{uid}` with:

```json
{"name":"Administrator","email":"admin@example.com","role":"admin","active":true}
```

The first administrator must be provisioned through the Firebase Console or a trusted Admin SDK script; never expose administrator creation in the public client.

## Build and deployment

Run `npm run build`, then deploy rules and hosting with `firebase deploy --only firestore:rules,hosting`. Use separate Firebase projects and environment files for development and production.

## Android and iOS apps

Capacitor packages the same React application as native Android and iOS projects.

1. Install Android Studio for Android builds; install Xcode on a Mac for iOS builds.
2. Run `npm run mobile:android` to synchronize assets and open Android Studio.
3. Run `npm run mobile:ios` on macOS to synchronize assets and open Xcode.
4. After every web change, run `npm run mobile:sync` before testing the native build.

Android APK/AAB packages are built in Android Studio. iOS builds and App Store signing require a Mac with Xcode.

## Data collections

The application uses `users`, `locations`, `feedback`, `notifications`, and `settings`. Timestamps are written with Firebase server timestamps. Notification documents and sequential references should ultimately be produced by trusted Cloud Functions to guarantee delivery and collision-free numbering at production scale.
