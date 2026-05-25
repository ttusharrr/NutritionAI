import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING } from '../theme/colors';
import { setupProfile } from '../api/authApi';
import { PremiumBackground } from '../components/AuthComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS = [
  { key: 'gender', title: "What's your gender?", subtitle: 'This helps us personalize your nutrition plan.' },
  { key: 'age', title: 'How old are you?', subtitle: 'Age affects your metabolic rate.' },
  { key: 'measurements', title: 'Your measurements', subtitle: 'Weight and height for accurate calculations.' },
  { key: 'activity', title: 'Activity level', subtitle: 'How active are you on a typical day?' },
  { key: 'dietary_type', title: 'Dietary preference', subtitle: 'What kind of food do you prefer?' },
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
          <View style={styles.sliderSection}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Age</Text>
              <View style={styles.sliderValueBadge}>
                <Text style={styles.sliderValue}>{profile.age}</Text>
                <Text style={styles.sliderUnit}>years</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={13}
              maximumValue={100}
              step={1}
              value={profile.age}
              onValueChange={(val) => setProfile({ ...profile, age: val })}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="rgba(255,255,255,0.08)"
              thumbTintColor={COLORS.primary}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.sliderRangeText}>13</Text>
              <Text style={styles.sliderRangeText}>100</Text>
            </View>
          </View>
        );

      case 'measurements':
        return (
          <>
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Weight</Text>
                <View style={styles.sliderValueBadge}>
                  <Text style={styles.sliderValue}>{profile.weight}</Text>
                  <Text style={styles.sliderUnit}>kg</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={200}
                step={1}
                value={profile.weight}
                onValueChange={(val) => setProfile({ ...profile, weight: val })}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor={COLORS.primary}
              />
              <View style={styles.sliderRange}>
                <Text style={styles.sliderRangeText}>30 kg</Text>
                <Text style={styles.sliderRangeText}>200 kg</Text>
              </View>
            </View>
            <View style={[styles.sliderSection, { marginTop: 24 }]}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Height</Text>
                <View style={styles.sliderValueBadge}>
                  <Text style={styles.sliderValue}>{profile.height}</Text>
                  <Text style={styles.sliderUnit}>cm</Text>
                </View>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={220}
                step={1}
                value={profile.height}
                onValueChange={(val) => setProfile({ ...profile, height: val })}
                minimumTrackTintColor={COLORS.secondary}
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor={COLORS.secondary}
              />
              <View style={styles.sliderRange}>
                <Text style={styles.sliderRangeText}>100 cm</Text>
                <Text style={styles.sliderRangeText}>220 cm</Text>
              </View>
            </View>
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
});
