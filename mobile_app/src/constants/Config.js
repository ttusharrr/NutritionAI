export const CONFIG = {
  // Point to Render backend directly for both dev and prod to avoid local firewall issues
  BASE_URL: 'http://10.75.239.24:5000/api',

  // Google OAuth client IDs
  // Web client ID (used by Expo Go)
  EXPO_CLIENT_ID: '1051916449617-8rsa54uaur43o43r0agqc1uaktu7r8cn.apps.googleusercontent.com',
  // Android client ID (replace with your actual Android OAuth client ID)
  ANDROID_CLIENT_ID: '1051916449617-gbno329cqd05fts3l96np2jqelm29id6.apps.googleusercontent.com',
  // iOS client ID (replace with your actual iOS OAuth client ID, optional)
  IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  // Legacy Google client ID (kept for backward compatibility)
  GOOGLE_CLIENT_ID: '1051916449617-8rsa54uaur43o43r0agqc1uaktu7r8cn.apps.googleusercontent.com',
};
