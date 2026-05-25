/**
 * ReminderSettings — Full reminder configuration screen.
 * Users can enable/disable individual meal reminders and set times.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { getReminders, updateReminders } from '../api/authApi';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleAllReminders,
} from '../utils/notificationService';

const SLOTS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳', description: 'Morning fuel to start your day' },
  { key: 'lunch', label: 'Lunch', icon: '🥗', description: 'Mid-day nutrition boost' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️', description: 'Evening meal for recovery' },
  { key: 'snacks', label: 'Snacks', icon: '🥜', description: 'Healthy energy between meals' },
  { key: 'drinks', label: 'Hydration', icon: '💧', description: 'Stay hydrated throughout the day' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function ReminderSettings({ navigation, isTab }) {
  const [reminders, setReminders] = useState({
    enabled: false,
    breakfast: { time: '08:00', enabled: false },
    lunch: { time: '13:00', enabled: false },
    dinner: { time: '20:00', enabled: false },
    snacks: { time: '16:00', enabled: false },
    drinks: { time: '10:00', enabled: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [timePickerSlot, setTimePickerSlot] = useState(null);
  const [tempHour, setTempHour] = useState(8);
  const [tempMinute, setTempMinute] = useState(0);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await getReminders();
      if (data?.reminders) {
        setReminders(data.reminders);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaster = (value) => {
    setReminders((prev) => ({ ...prev, enabled: value }));
    setHasChanges(true);
  };

  const toggleSlot = (slot, value) => {
    setReminders((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], enabled: value },
    }));
    setHasChanges(true);
  };

  const openTimePicker = (slot) => {
    const [h, m] = (reminders[slot]?.time || '08:00').split(':').map(Number);
    setTempHour(h);
    setTempMinute(m);
    setTimePickerSlot(slot);
  };

  const confirmTimePicker = () => {
    const timeStr = `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
    setReminders((prev) => ({
      ...prev,
      [timePickerSlot]: { ...prev[timePickerSlot], time: timeStr },
    }));
    setHasChanges(true);
    setTimePickerSlot(null);
  };

  const formatTime = (time24) => {
    if (!time24) return '08:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Request notification permissions first
      if (reminders.enabled) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Please enable notifications in your device settings to receive meal reminders.',
            [{ text: 'OK' }]
          );
          setSaving(false);
          return;
        }
      }

      // Save to backend
      const res = await updateReminders(reminders);
      if (res?.user) {
        await AsyncStorage.setItem('user', JSON.stringify(res.user));
      }

      // Schedule local notifications
      await scheduleAllReminders(reminders);

      // Proactive test notification: trigger a high-priority sound-rich reminder in 3 seconds to hear the classic sound instantly!
      if (reminders.enabled) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '✨ NutriAI Reminders Active!',
            body: 'Your classic notification sound and meal reminders are configured perfectly!',
            sound: 'default',
            ...(Platform.OS === 'android' && { channelId: 'meal-reminders-v3' }),
          },
          trigger: {
            type: 'timeInterval',
            seconds: 3,
            repeats: false,
          },
        });
      }

      setHasChanges(false);
      Alert.alert('✅ Saved!', 'Your meal reminders have been updated. A test notification will sound in 3 seconds!');
    } catch (err) {
      console.error('Failed to save reminders:', err);
      Alert.alert('Error', 'Failed to save reminders. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          {/* Header */}
          {!isTab && (
            <View style={styles.navBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.navTitle}>Meal Reminders</Text>
              <View style={{ width: 44 }} />
            </View>
          )}

          {/* Master Toggle Card */}
          <View style={[styles.masterCard, isTab && { marginTop: 24 }]}>
            <LinearGradient
              colors={reminders.enabled ? COLORS.gradients.primary : [COLORS.surface, COLORS.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.masterCardGradient}
            >
              <View style={styles.masterInfo}>
                <Text style={[styles.masterTitle, reminders.enabled && { color: '#000' }]}>
                  {reminders.enabled ? '🔔 Reminders Active' : '🔕 Reminders Off'}
                </Text>
                <Text style={[styles.masterSub, reminders.enabled && { color: 'rgba(0,0,0,0.5)' }]}>
                  {reminders.enabled
                    ? 'You will receive notifications at scheduled times'
                    : 'Enable to get notified at meal times'}
                </Text>
              </View>
              <Switch
                value={reminders.enabled}
                onValueChange={toggleMaster}
                trackColor={{ false: COLORS.border, true: 'rgba(0,0,0,0.2)' }}
                thumbColor={reminders.enabled ? '#000' : COLORS.textTertiary}
              />
            </LinearGradient>
          </View>

          {/* Reminder Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {SLOTS.map((slot) => {
              const config = reminders[slot.key] || { time: '08:00', enabled: false };
              const isActive = reminders.enabled && config.enabled;
              return (
                <View
                  key={slot.key}
                  style={[
                    styles.slotCard,
                    isActive && styles.slotCardActive,
                    !reminders.enabled && styles.slotCardDisabled,
                  ]}
                >
                  <View style={styles.slotLeft}>
                    <Text style={styles.slotIcon}>{slot.icon}</Text>
                    <View style={styles.slotInfo}>
                      <Text style={[styles.slotLabel, !reminders.enabled && styles.textDisabled]}>
                        {slot.label}
                      </Text>
                      <Text style={[styles.slotDesc, !reminders.enabled && styles.textDisabled]}>
                        {slot.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slotRight}>
                    <TouchableOpacity
                      style={[
                        styles.timeBtn,
                        isActive && styles.timeBtnActive,
                        !reminders.enabled && styles.timeBtnDisabled,
                      ]}
                      onPress={() => reminders.enabled && openTimePicker(slot.key)}
                      disabled={!reminders.enabled}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isActive ? COLORS.primary : COLORS.textTertiary}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          isActive && styles.timeTextActive,
                          !reminders.enabled && styles.textDisabled,
                        ]}
                      >
                        {formatTime(config.time)}
                      </Text>
                    </TouchableOpacity>
                    <Switch
                      value={config.enabled}
                      onValueChange={(v) => toggleSlot(slot.key, v)}
                      trackColor={{ false: COLORS.border, true: COLORS.primary + '40' }}
                      thumbColor={config.enabled ? COLORS.primary : COLORS.textTertiary}
                      disabled={!reminders.enabled}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Save Button */}
          {hasChanges && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={saving ? [COLORS.surface, COLORS.surface] : COLORS.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
                    <Text style={styles.saveBtnText}>Save Reminders</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textTertiary} />
            <Text style={styles.infoNoteText}>
              Reminders are scheduled as local notifications on your device. 
              Make sure notifications are enabled in your phone settings.
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Custom Time Picker Modal */}
      <Modal
        visible={timePickerSlot !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTimePickerSlot(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>
              Set Time — {SLOTS.find((s) => s.key === timePickerSlot)?.label || ''}
            </Text>

            <View style={styles.pickerRow}>
              {/* Hour Selector */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColLabel}>Hour</Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                >
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, tempHour === h && styles.pickerItemActive]}
                      onPress={() => setTempHour(h)}
                    >
                      <Text style={[styles.pickerItemText, tempHour === h && styles.pickerItemTextActive]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.pickerSeparator}>:</Text>

              {/* Minute Selector */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColLabel}>Minute</Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                >
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, tempMinute === m && styles.pickerItemActive]}
                      onPress={() => setTempMinute(m)}
                    >
                      <Text style={[styles.pickerItemText, tempMinute === m && styles.pickerItemTextActive]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.pickerPreview}>
              {(() => {
                const period = tempHour >= 12 ? 'PM' : 'AM';
                const h12 = tempHour % 12 || 12;
                return `${h12}:${String(tempMinute).padStart(2, '0')} ${period}`;
              })()}
            </Text>

            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={styles.pickerCancelBtn}
                onPress={() => setTimePickerSlot(null)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={confirmTimePicker}>
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pickerConfirmBtn}
                >
                  <Text style={styles.pickerConfirmText}>Confirm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  /* Master Toggle */
  masterCard: {
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  masterCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
  },
  masterInfo: {
    flex: 1,
  },
  masterTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  masterSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  /* Section */
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  /* Slot Cards */
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  slotCardActive: {
    borderColor: 'rgba(45, 212, 191, 0.25)',
    backgroundColor: 'rgba(45, 212, 191, 0.04)',
  },
  slotCardDisabled: {
    opacity: 0.5,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  slotIcon: {
    fontSize: 28,
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  slotDesc: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  slotRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timeBtnActive: {
    borderColor: 'rgba(45, 212, 191, 0.3)',
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  timeBtnDisabled: {
    opacity: 0.5,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timeTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  textDisabled: {
    opacity: 0.5,
  },
  /* Save Button */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  /* Info Note */
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  infoNoteText: {
    flex: 1,
    color: COLORS.textTertiary,
    fontSize: 11,
    lineHeight: 16,
  },
  /* Time Picker Modal */
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  pickerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pickerColumn: {
    alignItems: 'center',
    width: 80,
  },
  pickerColLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  pickerItemText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  pickerSeparator: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 24,
  },
  pickerPreview: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  pickerCancelText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  pickerConfirmBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  pickerConfirmText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
});
