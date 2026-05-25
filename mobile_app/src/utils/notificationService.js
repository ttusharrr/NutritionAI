/**
 * Notification Service — Schedules local meal/drink reminders using expo-notifications.
 * All reminders are scheduled as daily repeating local notifications.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_MESSAGES = {
  breakfast: {
    title: '🍳 Breakfast Time!',
    body: "Start your day right — it's time for a healthy breakfast!",
  },
  lunch: {
    title: '🥗 Lunch Time!',
    body: 'Fuel up! Your personalized lunch recommendation is waiting.',
  },
  dinner: {
    title: '🍽️ Dinner Time!',
    body: 'Time to wind down with a nutritious dinner.',
  },
  snacks: {
    title: '🥜 Snack Time!',
    body: 'Grab a healthy snack to keep your energy up!',
  },
  drinks: {
    title: '💧 Hydration Reminder!',
    body: "Don't forget to drink water! Stay hydrated.",
  },
};

/**
 * Request notification permissions from the user.
 * @returns {Promise<boolean>} Whether permission was granted.
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[NOTIFICATIONS] Permission not granted');
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meal-reminders-v3', {
      name: 'Meal Reminders',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2dd4bf',
    });
  }

  return true;
}

/**
 * Schedule all meal reminders based on user's settings.
 * Cancels all existing scheduled notifications first, then reschedules active ones.
 * @param {Object} reminders - The reminders config object from the backend.
 */
export async function scheduleAllReminders(reminders) {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!reminders?.enabled) {
    console.log('[NOTIFICATIONS] Reminders disabled — all cleared');
    await AsyncStorage.setItem('reminders', JSON.stringify(reminders || {}));
    return;
  }

  const slots = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks'];
  let scheduled = 0;

  for (const slot of slots) {
    const config = reminders[slot];
    if (!config?.enabled || !config?.time) continue;

    const [hours, minutes] = config.time.split(':').map(Number);
    const message = REMINDER_MESSAGES[slot];

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { type: 'meal_reminder', slot },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'meal-reminders-v3' }),
        },
        trigger: {
          type: 'daily',
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      scheduled++;
      console.log(`[NOTIFICATIONS] Scheduled ${slot} reminder at ${config.time}`);
    } catch (err) {
      console.error(`[NOTIFICATIONS] Failed to schedule ${slot}:`, err);
    }
  }

  console.log(`[NOTIFICATIONS] ${scheduled} reminders scheduled`);

  // Persist to AsyncStorage for offline access
  await AsyncStorage.setItem('reminders', JSON.stringify(reminders));
}

/**
 * Get the count of currently scheduled notifications.
 * @returns {Promise<number>}
 */
export async function getScheduledCount() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
