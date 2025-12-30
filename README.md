# CampusCircle Mobile

A React Native mobile application built with Expo and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing on physical devices)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npx expo start
```

This will start the Expo development server. You can then:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your phone

### Platform-Specific Commands

```bash
# Start on Android
npx expo start --android

# Start on iOS
npx expo start --ios

# Start on Web
npx expo start --web
```

## Project Structure

```
campusCircleMobile/
├── App.tsx          # Main application component
├── app.json         # Expo configuration
├── assets/          # Static assets (images, fonts)
├── index.ts         # Entry point
├── package.json     # Project dependencies
├── tsconfig.json    # TypeScript configuration
└── .github/         # GitHub configurations
```

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - React Native development platform
- **TypeScript** - Type-safe JavaScript

## Building for Production

```bash
# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios
```

Or use EAS Build for more control:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
