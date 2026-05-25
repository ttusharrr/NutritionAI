import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from './src/theme/colors';
import { CONFIG } from './src/constants/Config';

// Auth Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyOtpScreen from './src/screens/VerifyOtpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';

// Secondary Screens
import AboutScreen from './src/screens/AboutScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReminderSettingsScreen from './src/screens/ReminderSettingsScreen';

// Main WhatsApp-style tab container
import MainTabsScreen from './src/components/MainTabsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Landing');

  useEffect(() => {
    // Wake up Render backend immediately when app launches
    console.log(`[NutriAI] Warming up backend: ${CONFIG.BASE_URL}`);
    fetch(`${CONFIG.BASE_URL}/auth/health`, { method: 'GET' })
      .then((res) => {
        console.log(`[NutriAI] Backend warm-up response: ${res.status}`);
      })
      .catch((err) => {
        console.warn(`[NutriAI] Backend warm-up failed (will retry on login): ${err.message}`);
      });

    // Check if user has a stored token (persistent login)
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const user = await AsyncStorage.getItem('user');
        if (token && user) {
          console.log('[NutriAI] Found stored auth token, navigating to Main');
          setInitialRoute('Main');
        } else {
          console.log('[NutriAI] No stored auth token, showing Landing');
          setInitialRoute('Landing');
        }
      } catch (e) {
        console.error('[NutriAI] Error checking stored auth:', e);
        setInitialRoute('Landing');
      } finally {
        setIsReady(true);
      }
    };
    checkAuth();
  }, []);

  // Show a loading indicator while checking auth state
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

        {/* Main App - WhatsApp-style swipe tabs */}
        <Stack.Screen name="Main" component={MainTabsScreen} />

        {/* Drawer destinations */}
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ReminderSettings"
          component={ReminderSettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
