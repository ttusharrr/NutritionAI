import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, StatusBar, Alert,
  ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { setupProfile } from '../api/authApi';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  emoji: '🪑', label: 'Sedentary',         desc: 'Little or no exercise' },
  { value: 'light',      emoji: '🚶', label: 'Lightly Active',    desc: '1-3 days/week' },
  { value: 'moderate',   emoji: '🏃', label: 'Moderately Active', desc: '3-5 days/week' },
  { value: 'very_active',emoji: '🏋️', label: 'Very Active',       desc: '6-7 days/week' },
  { value: 'extreme',    emoji: '⚡', label: 'Extreme',           desc: 'Intense daily training' },
];

const GOAL_OPTIONS = [
  { value: 'lose_weight',  emoji: '🔥', label: 'Lose Weight' },
  { value: 'gain_muscle',  emoji: '💪', label: 'Gain Muscle' },
  { value: 'maintain',     emoji: '⚖️', label: 'Maintain' },
  { value: 'eat_healthy',  emoji: '🥗', label: 'Eat Healthier' },
];

const DIET_TYPE_OPTIONS = [
  { value: 'Veg',     emoji: '🥗', label: 'Vegetarian' },
  { value: 'Non-Veg', emoji: '🍗', label: 'Non-Veg' },
  { value: 'Both',    emoji: '🍽️', label: 'Both' },
];

const REGION_OPTIONS = [
  { value: 'Punjab',        label: 'Punjab 🌾' },
  { value: 'J&K',           label: 'Jammu & Kashmir 🏔️' },
  { value: 'Himachal',      label: 'Himachal Pradesh 🌲' },
  { value: 'Tamil Nadu',    label: 'Tamil Nadu 🛕' },
  { value: 'Maharashtra',   label: 'Maharashtra 🦁' },
  { value: 'Gujarat',       label: 'Gujarat 🌊' },
  { value: 'West Bengal',   label: 'West Bengal 🐯' },
  { value: 'Karnataka',     label: 'Karnataka 🐘' },
  { value: 'Kerala',        label: 'Kerala 🌴' },
  { value: 'Delhi',         label: 'Delhi 🏛️' },
  { value: 'International', label: 'International 🌍' },
];

const DISEASE_OPTIONS = [
  { id: 'BP',           label: 'Blood Pressure' },
  { id: 'Diabetes',     label: 'Diabetes' },
  { id: 'Cholesterol',  label: 'Cholesterol' },
  { id: 'Thyroid',      label: 'Thyroid' },
  { id: 'Heart',        label: 'Heart Disease' },
  { id: 'Kidney',       label: 'Kidney Issue' },
  { id: 'None',         label: 'None' },
];

export default function ProfileScreen({ navigation, isTab }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '', age: '', gender: '', weight: '', height: '',
    activity_level: '', dietary_goal: '', dietary_type: '',
    region: '', diseases: [], allergies: '',
  });

  const loadUser = useCallback(async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      setProfileData({
        name: u.name || '',
        age: u.profile?.age?.toString() || '',
        gender: u.profile?.gender || '',
        weight: u.profile?.weight?.toString() || '',
        height: u.profile?.height?.toString() || '',
        activity_level: u.profile?.activity_level || '',
        dietary_goal: u.profile?.dietary_goal || '',
        dietary_type: u.profile?.dietary_type || '',
        region: u.profile?.region || '',
        diseases: u.profile?.diseases || [],
        allergies: u.profile?.allergies || '',
      });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // Refresh when tab is focused
  useEffect(() => {
    if (isTab && navigation?.addListener) {
      const unsub = navigation.addListener('focus', loadUser);
      return unsub;
    }
  }, [isTab, navigation, loadUser]);

  const set = useCallback((key, val) => {
    setProfileData(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleDisease = useCallback((id) => {
    setProfileData(prev => {
      const list = prev.diseases.includes(id)
        ? prev.diseases.filter(d => d !== id)
        : [...prev.diseases.filter(d => d !== 'None'), id];
      // If 'None' selected, clear rest
      if (id === 'None') return { ...prev, diseases: ['None'] };
      return { ...prev, diseases: list.filter(d => d !== 'None') };
    });
  }, []);

  const handleSave = async () => {
    if (!profileData.name || !profileData.age || !profileData.weight || !profileData.height) {
      Alert.alert('Missing Info', 'Please fill in Name, Age, Weight and Height.');
      return;
    }
    setLoading(true);
    try {
      const response = await setupProfile({
        ...profileData,
        age: parseInt(profileData.age),
        weight: parseInt(profileData.weight),
        height: parseInt(profileData.height),
      });
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        Alert.alert('✅ Saved', 'Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  // ─── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView>
            {/* Hero */}
            <View style={styles.hero}>
              <LinearGradient
                colors={['rgba(45,212,191,0.2)', 'rgba(45,212,191,0.0)']}
                style={styles.avatarRing}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
              <Text style={styles.heroName}>{user?.name || '—'}</Text>
              <Text style={styles.heroEmail}>{user?.email || ''}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={16} color="#000" />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {[
                { label: 'Age', value: user?.profile?.age || '—', unit: 'yrs' },
                { label: 'Weight', value: user?.profile?.weight || '—', unit: 'kg' },
                { label: 'Height', value: user?.profile?.height || '—', unit: 'cm' },
              ].map(s => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statVal}>{s.value}</Text>
                  <Text style={styles.statUnit}>{s.unit}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Info Cards */}
            <InfoCard title="Physical Blueprint" items={[
              { icon: 'transgender-outline', label: 'Gender',    value: user?.profile?.gender },
              { icon: 'globe-outline',        label: 'Region',    value: user?.profile?.region },
              { icon: 'fitness-outline',      label: 'Activity',  value: user?.profile?.activity_level?.replace('_', ' ') },
              { icon: 'scale-outline',        label: 'BMI',       value: user?.daily_nutrition?.bmi_data?.value ? `${user.daily_nutrition.bmi_data.value} (${user.daily_nutrition.bmi_data.status})` : '—' },
            ]} />

            <InfoCard title="Nutrition Profile" items={[
              { icon: 'restaurant-outline',      label: 'Diet Type', value: user?.profile?.dietary_type },
              { icon: 'trending-up-outline',     label: 'Goal',      value: user?.profile?.dietary_goal?.replace('_', ' ') },
              { icon: 'medkit-outline',          label: 'Conditions',value: user?.profile?.diseases?.length > 0 ? user.profile.diseases.join(', ') : 'None' },
              { icon: 'alert-circle-outline',    label: 'Allergies', value: user?.profile?.allergies || 'None' },
            ]} />
          </SafeAreaView>
        </ScrollView>
      </View>
    );
  }

  // ─── EDIT MODE ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Edit Header */}
        <SafeAreaView>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.editHeaderTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Basic Info ── */}
          <SectionTitle title="Basic Information" />
          <View style={styles.card}>
            <InputField label="Full Name" value={profileData.name}
              onChangeText={v => set('name', v)} placeholder="Your name" />

            <View style={styles.row}>
              <InputField label="Age" value={profileData.age}
                onChangeText={v => set('age', v)} placeholder="Years"
                keyboardType="numeric" flex />
              <View style={{ width: 12 }} />
              <InputField label="Weight (kg)" value={profileData.weight}
                onChangeText={v => set('weight', v)} placeholder="kg"
                keyboardType="numeric" flex />
              <View style={{ width: 12 }} />
              <InputField label="Height (cm)" value={profileData.height}
                onChangeText={v => set('height', v)} placeholder="cm"
                keyboardType="numeric" flex />
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {['male', 'female', 'other'].map(g => (
                <Chip key={g} label={g.charAt(0).toUpperCase() + g.slice(1)}
                  active={profileData.gender === g} onPress={() => set('gender', g)} />
              ))}
            </View>
          </View>

          {/* ── Activity ── */}
          <SectionTitle title="Activity Level" />
          <View style={styles.card}>
            {ACTIVITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.listOption, profileData.activity_level === opt.value && styles.listOptionActive]}
                onPress={() => set('activity_level', opt.value)}
              >
                <Text style={styles.listEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listLabel, profileData.activity_level === opt.value && { color: COLORS.primary }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.listDesc}>{opt.desc}</Text>
                </View>
                {profileData.activity_level === opt.value &&
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Diet & Goal ── */}
          <SectionTitle title="Nutrition Preferences" />
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Dietary Type</Text>
            <View style={styles.chipRow}>
              {DIET_TYPE_OPTIONS.map(opt => (
                <Chip key={opt.value}
                  label={`${opt.emoji} ${opt.label}`}
                  active={profileData.dietary_type === opt.value}
                  onPress={() => set('dietary_type', opt.value)} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Dietary Goal</Text>
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.goalCard, profileData.dietary_goal === opt.value && styles.goalCardActive]}
                  onPress={() => set('dietary_goal', opt.value)}
                >
                  <Text style={styles.goalEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.goalLabel, profileData.dietary_goal === opt.value && { color: COLORS.primary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Region ── */}
          <SectionTitle title="Regional Cuisine" />
          <View style={styles.card}>
            <View style={styles.chipRow}>
              {REGION_OPTIONS.map(opt => (
                <Chip key={opt.value} label={opt.label}
                  active={profileData.region === opt.value}
                  onPress={() => set('region', opt.value)} small />
              ))}
            </View>
          </View>

          {/* ── Health ── */}
          <SectionTitle title="Health Conditions" />
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Medical Conditions</Text>
            <View style={styles.chipRow}>
              {DISEASE_OPTIONS.map(d => (
                <Chip key={d.id} label={d.label}
                  active={profileData.diseases.includes(d.id)}
                  onPress={() => toggleDisease(d.id)}
                  danger={d.id !== 'None'} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Food Allergies</Text>
            <InputField
              label="" value={profileData.allergies}
              onChangeText={v => set('allergies', v)}
              placeholder="e.g. Peanuts, Dairy, Gluten" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoCard({ title, items }) {
  return (
    <>
      <SectionTitle title={title} />
      <View style={styles.infoCard}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value || 'Not set'}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
    </>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, flex }) {
  return (
    <View style={[styles.inputGroup, flex && { flex: 1 }]}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

function Chip({ label, active, onPress, small, danger }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && (danger ? styles.chipDangerActive : styles.chipActive),
        small && styles.chipSmall,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && (danger ? styles.chipDangerText : styles.chipActiveText), small && { fontSize: 12 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 20 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 24 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
    marginBottom: 14,
  },
  avatarText: { color: COLORS.primary, fontSize: 36, fontWeight: '800' },
  heroName: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  heroEmail: { color: COLORS.textTertiary, fontSize: 13, marginTop: 4 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, marginTop: 16,
  },
  editBtnText: { color: '#000', fontSize: 14, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 18, padding: 16, alignItems: 'center',
  },
  statVal: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  statUnit: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  statLabel: { color: COLORS.textTertiary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(45,212,191,0.08)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  infoLabel: { color: COLORS.textTertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: COLORS.border },

  // Section
  sectionTitle: {
    color: COLORS.text, fontSize: 15, fontWeight: '800',
    marginTop: 20, marginBottom: 10, letterSpacing: -0.3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20, borderWidth: 1,
    borderColor: COLORS.border, padding: 16, marginBottom: 4,
  },

  // Edit Header
  editHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelBtn: { width: 40, height: 40, justifyContent: 'center' },
  editHeaderTitle: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12,
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Inputs
  inputGroup: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 4, letterSpacing: 0.4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14,
    color: COLORS.text, fontSize: 14,
  },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20,
  },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(45,212,191,0.1)' },
  chipDangerActive: { borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)' },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  chipActiveText: { color: COLORS.primary, fontWeight: '700' },
  chipDangerText: { color: '#f97316', fontWeight: '700' },

  // Activity list
  listOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  listOptionActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(45,212,191,0.07)' },
  listEmoji: { fontSize: 22 },
  listLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  listDesc: { color: COLORS.textTertiary, fontSize: 12, marginTop: 2 },

  // Goal grid
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 16, padding: 16, alignItems: 'center', gap: 8,
  },
  goalCardActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(45,212,191,0.08)' },
  goalEmoji: { fontSize: 26 },
  goalLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
