export const CONFIG = {
  // Production: Render backend URL for EAS builds
  // Falls back to local IP for development (change LOCAL_DEV_URL for your machine)
  LOCAL_DEV_URL: 'http://10.75.239.24:5000/api',
  PRODUCTION_URL: 'https://nutritionai.onrender.com/api',

  // Use production URL by default — EAS builds always use this
  // Toggle to LOCAL_DEV_URL only when running locally with `npx expo start`
  BASE_URL: __DEV__
    ? 'http://10.75.239.24:5000/api'
    : 'https://nutritionai.onrender.com/api',

  // Google OAuth client IDs
  // Web client ID (used as webClientId in GoogleSignin.configure — required for idToken)
  EXPO_CLIENT_ID: '1051916449617-8rsa54uaur43o43r0agqc1uaktu7r8cn.apps.googleusercontent.com',
  // Android client ID (SHA-1 keyed, used by native Google SDK on device)
  ANDROID_CLIENT_ID: '1051916449617-gbno329cqd05fts3l96np2jqelm29id6.apps.googleusercontent.com',
  // iOS client ID (replace with your actual iOS OAuth client ID, optional)
  IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  // Legacy Google client ID (kept for backward compatibility)
  GOOGLE_CLIENT_ID: '1051916449617-8rsa54uaur43o43r0agqc1uaktu7r8cn.apps.googleusercontent.com',
};
