import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

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

// Main WhatsApp-style tab container
import MainTabsScreen from './src/components/MainTabsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  // Wake up Render backend immediately when app launches
  useEffect(() => {
    fetch(`${CONFIG.BASE_URL}/auth/health`, { method: 'GET' }).catch(() => {});
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Landing"
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
