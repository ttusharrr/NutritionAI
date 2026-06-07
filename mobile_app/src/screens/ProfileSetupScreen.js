import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING } from '../theme/colors';
import { setupProfile } from '../api/authApi';
import { PremiumBackground } from '../components/AuthComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumNumericSelector = ({ label, value, unit, onChange, min, max, color }) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleTextChange = (text) => {
    const numericValue = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    onChange(numericValue);
  };

  const handleBlur = () => {
    if (value < min) onChange(min);
    if (value > max) onChange(max);
  };

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      
      <View style={styles.selectorControlsRow}>
        <TouchableOpacity 
          style={[styles.selectorBtn, { borderColor: color || COLORS.primary }]} 
          onPress={handleDecrement}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={24} color={color || COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.selectorValueWrapper}>
          <TextInput
            style={[styles.selectorInput, { color: color || COLORS.primary }]}
            value={value.toString()}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          <Text style={styles.selectorUnit}>{unit}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.selectorBtn, { borderColor: color || COLORS.primary }]} 
          onPress={handleIncrement}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={color || COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.selectorRange}>
        <Text style={styles.selectorRangeText}>Min: {min} {unit}</Text>
        <Text style={styles.selectorRangeText}>Max: {max} {unit}</Text>
      </View>
    </View>
  );
};

const STEPS = [
  { key: 'gender', title: "What's your gender?", subtitle: 'This helps us personalize your nutrition plan.' },
  { key: 'age', title: 'How old are you?', subtitle: 'Age affects your metabolic rate.' },
  { key: 'measurements', title: 'Your measurements', subtitle: 'Weight and height for accurate calculations.' },
  { key: 'activity', title: 'Activity level', subtitle: 'How active are you on a typical day?' },
  { key: 'dietary_type', title: 'Dietary preference', subtitle: 'What kind of food do you prefer?' },
  { key: 'health', title: 'Health & Allergies', subtitle: 'Any medical conditions or food allergies?' },
  { key: 'goal', title: 'Your dietary goal', subtitle: 'What would you like to achieve?' },
];

export default function ProfileSetupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    gender: '',
    age: 25,
    weight: 70,
    height: 170,
    activity_level: '',
    dietary_type: 'Both',
    dietary_goal: '',
    region: 'Punjab',
    diseases: [],
    allergies: '',
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (STEPS[step].key) {
      case 'gender': return !!profile.gender;
      case 'age': return profile.age >= 13 && profile.age <= 100;
      case 'measurements': return profile.weight > 0 && profile.height > 0;
      case 'activity': return !!profile.activity_level;
      case 'dietary_type': return !!profile.dietary_type;
      case 'goal': return !!profile.dietary_goal;
      default: return true;
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await setupProfile(profile);
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step];

  const renderStepContent = () => {
    switch (currentStep.key) {
      case 'gender':
        return (
          <View style={styles.optionGrid3}>
            {[
              { value: 'male', emoji: '👨', label: 'Male' },
              { value: 'female', emoji: '👩', label: 'Female' },
              { value: 'other', emoji: '🧑', label: 'Other' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, profile.gender === opt.value && styles.optionCardActive]}
                onPress={() => setProfile({ ...profile, gender: opt.value })}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, profile.gender === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'age':
        return (
          <PremiumNumericSelector
            label="Age"
            value={profile.age}
            unit="years"
            onChange={(val) => setProfile({ ...profile, age: val })}
            min={13}
            max={100}
            color={COLORS.primary}
          />
        );

      case 'measurements':
        return (
          <>
            <PremiumNumericSelector
              label="Weight"
              value={profile.weight}
              unit="kg"
              onChange={(val) => setProfile({ ...profile, weight: val })}
              min={30}
              max={200}
              color={COLORS.primary}
            />
            <PremiumNumericSelector
              label="Height"
              value={profile.height}
              unit="cm"
              onChange={(val) => setProfile({ ...profile, height: val })}
              min={100}
              max={220}
              color={COLORS.secondary}
            />
          </>
        );

      case 'activity':
        return (
          <View style={styles.optionList}>
            {[
              { value: 'sedentary', emoji: '🪑', label: 'Sedentary', desc: 'Little or no exercise' },
              { value: 'light', emoji: '🚶', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
              { value: 'moderate', emoji: '🏃', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
              { value: 'very_active', emoji: '🏋️', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
              { value: 'extreme', emoji: '⚡', label: 'Extremely Active', desc: 'Intense daily training' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.listOption, profile.activity_level === opt.value && styles.listOptionActive]}
                onPress={() => setProfile({ ...profile, activity_level: opt.value })}
              >
                <Text style={styles.listEmoji}>{opt.emoji}</Text>
                <View style={styles.listContent}>
                  <Text style={[styles.listLabel, profile.activity_level === opt.value && styles.listLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.listDesc}>{opt.desc}</Text>
                </View>
                {profile.activity_level === opt.value && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'dietary_type':
        return (
          <View style={styles.optionGrid3}>
            {[
              { value: 'Veg', emoji: '🥗', label: 'Vegetarian' },
              { value: 'Non-Veg', emoji: '🍗', label: 'Non-Veg' },
              { value: 'Both', emoji: '🍽️', label: 'Both' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, profile.dietary_type === opt.value && styles.optionCardActive]}
                onPress={() => setProfile({ ...profile, dietary_type: opt.value })}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, profile.dietary_type === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'health':
        return (
          <View style={styles.healthSection}>
            <Text style={styles.fieldLabel}>Medical Conditions</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'BP',           label: 'Blood Pressure' },
                { id: 'Diabetes',     label: 'Diabetes' },
                { id: 'Cholesterol',  label: 'Cholesterol' },
                { id: 'Thyroid',      label: 'Thyroid' },
                { id: 'Heart',        label: 'Heart Disease' },
                { id: 'Kidney',       label: 'Kidney Issue' },
                { id: 'None',         label: 'None' },
              ].map((d) => {
                const isActive = profile.diseases.includes(d.id);
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.chip,
                      isActive && (d.id !== 'None' ? styles.chipDangerActive : styles.chipActive),
                    ]}
                    onPress={() => {
                      let list = [...profile.diseases];
                      if (d.id === 'None') {
                        list = ['None'];
                      } else {
                        list = list.filter((item) => item !== 'None');
                        if (list.includes(d.id)) {
                          list = list.filter((item) => item !== d.id);
                        } else {
                          list.push(d.id);
                        }
                      }
                      setProfile({ ...profile, diseases: list });
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && (d.id !== 'None' ? styles.chipDangerText : styles.chipActiveText),
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Food Allergies (Optional)</Text>
            <TextInput
              style={styles.setupInput}
              value={profile.allergies}
              onChangeText={(text) => setProfile({ ...profile, allergies: text })}
              placeholder="e.g. Peanuts, Milk, Gluten"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="none"
            />
          </View>
        );

      case 'goal':
        return (
          <View style={styles.optionGrid2}>
            {[
              { value: 'lose_weight', emoji: '🔥', label: 'Lose Weight' },
              { value: 'gain_muscle', emoji: '💪', label: 'Gain Muscle' },
              { value: 'maintain', emoji: '⚖️', label: 'Maintain' },
              { value: 'eat_healthy', emoji: '🥗', label: 'Eat Healthier' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionCard, profile.dietary_goal === opt.value && styles.optionCardActive]}
                onPress={() => setProfile({ ...profile, dietary_goal: opt.value })}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, profile.dietary_goal === opt.value && styles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandLogo}>NutriAI</Text>
            <Text style={styles.brandTagline}>Profile Setup</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>Step {step + 1} of {STEPS.length}</Text>
          </View>

          {/* Error */}
          {error !== '' && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Step Title */}
          <Text style={styles.stepTitle}>{currentStep.title}</Text>
          <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <View style={styles.buttonRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={nextStep}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <Text style={styles.nextBtnText}>Saving...</Text>
              ) : step === STEPS.length - 1 ? (
                <>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.nextBtnText}>Finish Setup</Text>
                </>
              ) : (
                <>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingTop: 50,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '600',
    marginTop: 4,
  },
  /* Progress */
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  progressText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  /* Error */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  /* Step Title */
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 28,
    lineHeight: 20,
  },
  /* Option Grid 3 cols */
  optionGrid3: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  optionGrid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: COLORS.primary,
  },
  /* Activity List */
  optionList: {
    gap: 10,
    marginBottom: 32,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  listOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  listEmoji: {
    fontSize: 24,
  },
  listContent: {
    flex: 1,
  },
  listLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  listLabelActive: {
    color: COLORS.primary,
  },
  listDesc: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  /* Slider */
  sliderSection: {
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sliderValueBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sliderValue: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  sliderUnit: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderRangeText: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  /* Buttons */
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  skipText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  /* Premium Selector styles */
  selectorContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: SPACING.md,
  },
  selectorLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  selectorBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorValueWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  selectorInput: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
  selectorUnit: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  selectorRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  selectorRangeText: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  /* Health Step styles */
  healthSection: {
    marginBottom: 32,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45,212,191,0.1)',
  },
  chipDangerActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipActiveText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  chipDangerText: {
    color: '#f97316',
    fontWeight: '700',
  },
  setupInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    marginTop: 8,
  },
});
