/**
 * ProfileSetup — Post-signup biometric wizard.
 * Collects: gender, age, weight, height, activity level, dietary goal.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiArrowLeft, HiCheck, HiExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

const STEPS = [
  { key: 'gender', title: 'What\'s your gender?', subtitle: 'This helps us personalize your nutrition plan.' },
  { key: 'age', title: 'How old are you?', subtitle: 'Age affects your metabolic rate.' },
  { key: 'measurements', title: 'Your measurements', subtitle: 'Weight and height for accurate calculations.' },
  { key: 'activity', title: 'Activity level', subtitle: 'How active are you on a typical day?' },
  { key: 'dietary_type', title: 'Dietary preference', subtitle: 'What kind of food do you prefer?' },
  { key: 'goal', title: 'Your dietary goal', subtitle: 'What would you like to achieve?' },
];

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.2 } }),
};

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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
      setDirection(1);
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await authApi.profileSetup(profile);
      updateUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="auth-scene">
      <div className="auth-orb auth-orb--cyan" />
      <div className="auth-orb auth-orb--purple" />
      <div className="auth-grid" />

      <div className="glass-card auth-card" style={{ maxWidth: '520px', zIndex: 1 }}>
        {/* Brand */}
        <div className="brand" style={{ marginBottom: '20px' }}>
          <div className="brand-logo" style={{ fontSize: '28px' }}>NutriAI</div>
          <div className="brand-tagline">Profile Setup</div>
        </div>

        {/* Progress bar */}
        <div className="setup-progress">
          <div className="setup-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {error && (
          <motion.div className="alert alert-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HiExclamationCircle className="alert-icon" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentStep.key} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
            <h3 className="setup-title">{currentStep.title}</h3>
            <p className="setup-description">{currentStep.subtitle}</p>

            {/* Gender */}
            {currentStep.key === 'gender' && (
              <div className="segmented-group cols-3">
                {[
                  { value: 'male', emoji: '👨', label: 'Male' },
                  { value: 'female', emoji: '👩', label: 'Female' },
                  { value: 'other', emoji: '🧑', label: 'Other' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`segmented-btn ${profile.gender === opt.value ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, gender: opt.value })}
                  >
                    <span className="emoji">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Age */}
            {currentStep.key === 'age' && (
              <div className="slider-wrapper">
                <div className="slider-header">
                  <span className="form-label" style={{ margin: 0 }}>Age</span>
                  <span className="slider-value">{profile.age} years</span>
                </div>
                <input
                  type="range"
                  min="13"
                  max="100"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                />
              </div>
            )}

            {/* Measurements */}
            {currentStep.key === 'measurements' && (
              <>
                <div className="slider-wrapper">
                  <div className="slider-header">
                    <span className="form-label" style={{ margin: 0 }}>Weight</span>
                    <span className="slider-value">{profile.weight} kg</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: parseInt(e.target.value) })}
                  />
                </div>
                <div className="slider-wrapper">
                  <div className="slider-header">
                    <span className="form-label" style={{ margin: 0 }}>Height</span>
                    <span className="slider-value">{profile.height} cm</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="220"
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: parseInt(e.target.value) })}
                  />
                </div>
              </>
            )}

            {/* Activity Level */}
            {currentStep.key === 'activity' && (
              <div className="segmented-group" style={{ gridTemplateColumns: '1fr' }}>
                {[
                  { value: 'sedentary', emoji: '🪑', label: 'Sedentary', desc: 'Little or no exercise' },
                  { value: 'light', emoji: '🚶', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
                  { value: 'moderate', emoji: '🏃', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
                  { value: 'very_active', emoji: '🏋️', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
                  { value: 'extreme', emoji: '⚡', label: 'Extremely Active', desc: 'Intense daily training' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`segmented-btn ${profile.activity_level === opt.value ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, activity_level: opt.value })}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', padding: '14px 16px' }}
                  >
                    <span style={{ fontSize: '24px' }}>{opt.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Dietary Preference */}
            {currentStep.key === 'dietary_type' && (
              <div className="segmented-group cols-3">
                {[
                  { value: 'Veg', emoji: '🥗', label: 'Vegetarian' },
                  { value: 'Non-Veg', emoji: '🍗', label: 'Non-Vegetarian' },
                  { value: 'Both', emoji: '🍽️', label: 'Both' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`segmented-btn ${profile.dietary_type === opt.value ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, dietary_type: opt.value })}
                  >
                    <span className="emoji">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Goal */}
            {currentStep.key === 'goal' && (
              <div className="segmented-group cols-2">
                {[
                  { value: 'lose_weight', emoji: '🔥', label: 'Lose Weight' },
                  { value: 'gain_muscle', emoji: '💪', label: 'Gain Muscle' },
                  { value: 'maintain', emoji: '⚖️', label: 'Maintain' },
                  { value: 'eat_healthy', emoji: '🥗', label: 'Eat Healthier' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`segmented-btn ${profile.dietary_goal === opt.value ? 'active' : ''}`}
                    onClick={() => setProfile({ ...profile, dietary_goal: opt.value })}
                  >
                    <span className="emoji">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {step > 0 && (
            <motion.button
              type="button"
              className="btn btn-secondary"
              onClick={prevStep}
              whileTap={{ scale: 0.98 }}
              style={{ width: 'auto', padding: '14px 24px' }}
            >
              <HiArrowLeft />
            </motion.button>
          )}
          <motion.button
            type="button"
            className="btn btn-primary"
            onClick={nextStep}
            disabled={!canProceed() || loading}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="btn-spinner" />
            ) : step === STEPS.length - 1 ? (
              <><HiCheck /> Finish Setup</>
            ) : (
              <>Continue <HiArrowRight /></>
            )}
          </motion.button>
        </div>

        {/* Skip */}
        <div className="text-center mt-md">
          <button className="btn-ghost" onClick={() => navigate('/dashboard')} style={{ fontSize: '13px' }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
