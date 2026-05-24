import { NativeModules, Alert } from 'react-native';

let GoogleSignin = null;
let statusCodes = {};
let isGoogleSigninAvailable = false;

try {
  // In Expo Go, NativeModules.RNGoogleSignin is undefined.
  // In a custom development build (npx expo run:android/ios) or production, it exists.
  if (NativeModules.RNGoogleSignin) {
    const GoogleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleSigninModule.GoogleSignin;
    statusCodes = GoogleSigninModule.statusCodes;
    isGoogleSigninAvailable = true;
    console.log('[GoogleSignin Safe Wrapper] Loaded native Google Sign-In SDK successfully.');
  } else {
    console.log('[GoogleSignin Safe Wrapper] Native binary module missing. Using Expo Go fallback stub.');
  }
} catch (e) {
  console.warn('[GoogleSignin Safe Wrapper] Failed to load native library (expected in Expo Go):', e.message);
}

// Stub implementation to prevent top-level and method crashes in Expo Go
const GoogleSigninStub = {
  configure: (config) => {
    console.log('[GoogleSignin Safe Wrapper] Stub: configure() called with:', config);
  },
  hasPlayServices: async () => {
    console.log('[GoogleSignin Safe Wrapper] Stub: hasPlayServices() called');
    return false;
  },
  signIn: async () => {
    console.log('[GoogleSignin Safe Wrapper] Stub: signIn() called');
    Alert.alert(
      "Development Build Required",
      "Native Google Sign-In requires native binary support, which is not built into the default Expo Go app.\n\nTo test the native Google authentication flow, build a custom development build:\n👉 npx expo run:android\n\nOr use email & password to test all other features!",
      [{ text: "OK" }]
    );
    throw new Error('SIGN_IN_FAILED_EXPO_GO');
  },
  signOut: async () => {
    console.log('[GoogleSignin Safe Wrapper] Stub: signOut() called');
  }
};

const ExportedGoogleSignin = isGoogleSigninAvailable ? GoogleSignin : GoogleSigninStub;
const ExportedStatusCodes = isGoogleSigninAvailable ? statusCodes : {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export {
  ExportedGoogleSignin as GoogleSignin,
  ExportedStatusCodes as statusCodes,
  isGoogleSigninAvailable
};
