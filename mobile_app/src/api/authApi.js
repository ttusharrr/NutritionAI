import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { CONFIG } from '../constants/Config';

// Centralized API URL from Config.js (auto-switches dev ↔ production)
const BASE_URL = CONFIG.BASE_URL;

console.log(`[NutriAI API] Connecting to: ${BASE_URL}`);

const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout — generous for Render cold starts
});

// Intercept requests to add token
authApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Log outgoing requests in dev
  if (__DEV__) {
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

// ─── Response interceptor: handle retries + automatic token refresh ───
authApi.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API ←] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;

    // ─── Case 1: Network / connection error (no HTTP response at all) ───
    // This typically means Render backend is sleeping (cold start)
    if (!response) {
      config.__retryCount = config.__retryCount || 0;
      const maxRetries = 5; // 5 attempts × 3s = 15s max wait (was 25 × 2s = 50s!)
      
      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        console.warn(
          `[API Network Error] Attempt ${config.__retryCount}/${maxRetries}. ` +
          `Server may be waking up. Retrying in 3s... (${config.url})`
        );
        
        // Wait 3 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        // Clone config and retry (clear adapter to avoid stale refs)
        const retryConfig = { ...config };
        delete retryConfig.adapter;
        return authApi(retryConfig);
      }

      // All retries exhausted — provide a clear production-grade error
      console.error(
        `[API FATAL] All ${maxRetries} retry attempts failed for ${config.url}. ` +
        `Backend may be down or unreachable at: ${config.baseURL}`
      );
      
      // Attach a friendly message for the UI to display
      error.userMessage = 'Server is temporarily unavailable. Please check your internet connection and try again in a moment.';
      return Promise.reject(error);
    }

    // ─── Case 2: 401 Unauthorized — attempt automatic token refresh ───
    if (response.status === 401 && !config.__isRetryAfterRefresh) {
      const errorCode = response.data?.code;
      
      // Only auto-refresh for expired tokens (not for invalid/revoked/missing)
      if (errorCode === 'token_expired') {
        console.log('[API Auth] Access token expired. Attempting refresh...');
        
        try {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshResponse = await axios.post(
              `${BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${refreshToken}`,
                  'Content-Type': 'application/json',
                },
                timeout: 15000,
              }
            );

            const newAccessToken = refreshResponse.data.access_token;
            if (newAccessToken) {
              await AsyncStorage.setItem('token', newAccessToken);
              console.log('[API Auth] Token refreshed successfully.');

              // Retry original request with new token
              config.__isRetryAfterRefresh = true;
              config.headers.Authorization = `Bearer ${newAccessToken}`;
              return authApi(config);
            }
          }
        } catch (refreshErr) {
          console.error('[API Auth] Token refresh failed:', refreshErr.message);
          // Clear stored credentials — user needs to re-login
          await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        }
      }

      // For revoked/invalid/missing tokens, clear auth state
      if (['token_revoked', 'invalid_token', 'missing_token'].includes(errorCode)) {
        console.warn(`[API Auth] Auth error: ${errorCode}. Clearing session.`);
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
      }
    }

    // ─── Case 3: Other HTTP errors (4xx, 5xx) — log and pass through ───
    if (response) {
      console.error(
        `[API Error] ${response.status} ${config.url}: `,
        JSON.stringify(response.data || {}).substring(0, 200)
      );
    }

    return Promise.reject(error);
  }
);

// ─── Auth API Functions ───

export const login = async (email, password) => {
  const response = await authApi.post('/auth/login', { email, password });
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
    if (response.data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', response.data.refresh_token);
    }
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await authApi.post('/auth/register', { name, email, password });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await authApi.post('/auth/verify-otp', { email, otp });
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
    if (response.data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', response.data.refresh_token);
    }
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const resendOtp = async (email) => {
  const response = await authApi.post('/auth/resend-otp', { email });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await authApi.post('/auth/forgot-password', { email });
  return response.data;
};

export const loginWithGoogle = async (credential) => {
  console.log('[Google Auth] Sending ID token to backend for verification...');
  const response = await authApi.post('/auth/google', { credential });
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
    if (response.data.refresh_token) {
      await AsyncStorage.setItem('refreshToken', response.data.refresh_token);
    }
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('[Google Auth] Login successful, tokens stored.');
  }
  return response.data;
};

export const setupProfile = async (profileData) => {
  const response = await authApi.post('/auth/profile-setup', profileData);
  if (response.data.user) {
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getRecommendations = async (forceRefresh = false) => {
  const url = forceRefresh ? '/nutrition/recommend?force_refresh=true' : '/nutrition/recommend';
  const response = await authApi.get(url);
  return response.data;
};

export const getRecipe = async (dishName) => {
  const response = await authApi.get(`/nutrition/recipe?dish=${encodeURIComponent(dishName)}`);
  return response.data;
};

export const chatWithAgent = async (message, history = []) => {
  const response = await authApi.post('/nutrition/chat', { message, history });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await authApi.post('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

export const logout = async () => {
  try {
    // Try to notify backend to revoke token
    await authApi.post('/auth/logout');
  } catch (err) {
    // Ignore errors — clear local state regardless
    console.warn('[Logout] Backend logout failed (token may already be expired):', err.message);
  }
  await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
};

// ─── Water Intake APIs ───
export const logWater = async (amount_ml = 250) => {
  const response = await authApi.post('/water/log', { amount_ml });
  return response.data;
};

export const getTodayWater = async () => {
  const response = await authApi.get('/water/today');
  return response.data;
};

export const getWaterHistory = async (days = 7) => {
  const response = await authApi.get(`/water/history?days=${days}`);
  return response.data;
};

export const setWaterGoal = async (goal_ml) => {
  const response = await authApi.put('/water/goal', { goal_ml });
  return response.data;
};

// ─── Reminder APIs ───
export const getReminders = async () => {
  const response = await authApi.get('/auth/reminders');
  return response.data;
};

export const updateReminders = async (reminders) => {
  const response = await authApi.put('/auth/reminders', { reminders });
  return response.data;
};

// ─── Client Error Reporting to Server (Render logs) ───
export const reportClientError = async (context, message, level = 'error') => {
  try {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isDev: __DEV__,
    };
    // Direct call with separate axios config to prevent interceptor retry loops
    await axios.post(`${BASE_URL}/diag/log`, {
      context,
      message,
      level,
      device_info: deviceInfo,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  } catch (err) {
    // Fail silently to avoid infinite logs or app crash
    console.warn('[reportClientError Failed]', err.message);
  }
};

export default authApi;

