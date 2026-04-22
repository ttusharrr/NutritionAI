import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// USE YOUR LOCAL IP ADDRESS HERE (e.g., 192.168.x.x)
const BASE_URL = 'http://192.168.29.178:5000/api'; 

const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add token
authApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const getRecommendations = async () => {
  const response = await authApi.get('/nutrition/recommend');
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

export default authApi;
