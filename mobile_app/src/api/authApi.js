import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CONFIG } from '../constants/Config';

// Centralized IP address from Config.js
const BASE_URL = CONFIG.BASE_URL; 

const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s individual request timeout
});

// Intercept requests to add token
authApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle Render cold starts (network retries)
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // If there is no response (meaning it's a network / connection error, not an HTTP error)
    if (!response) {
      config.__retryCount = config.__retryCount || 0;
      const maxRetries = 25; // 25 attempts * 2s = 50s total wait time
      
      if (config.__retryCount < maxRetries) {
        config.__retryCount += 1;
        console.warn(`[Axios Network Error] Attempt ${config.__retryCount}/${maxRetries} failed. Server might be sleeping. Retrying in 2s...`);
        
        // Wait 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Resolve the retry by making the request again
        return authApi(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  const response = await authApi.post('/auth/login', { email, password });
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
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
  const response = await authApi.post('/auth/google', { credential });
  if (response.data.access_token) {
    await AsyncStorage.setItem('token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
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
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
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

export default authApi;
