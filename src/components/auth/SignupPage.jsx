/**
 * SignupPage — Multi-step registration with password strength meter.
 * Step 1: Name & Email  |  Step 2: Password  |  Step 3: Terms
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlineUser, HiOutlineMail, HiOutlineLockClosed,
  HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle,
  HiArrowRight, HiArrowLeft, HiCheck
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

function getPasswordStrength(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: '' };
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return { score, label: labels[score] || '' };
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (error) setError('');
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const validateStep = (s) => {
    const errors = {};

    if (s === 1) {
      if (!form.name.trim()) errors.name = 'Name is required';
      else if (form.name.trim().length < 2) errors.name = 'Name too short';

      if (!form.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
    }

    if (s === 2) {
      if (!form.password) errors.password = 'Password is required';
      else if (form.password.length < 8) errors.password = 'At least 8 characters';
      else if (!/[A-Z]/.test(form.password)) errors.password = 'Need an uppercase letter';
      else if (!/[a-z]/.test(form.password)) errors.password = 'Need a lowercase letter';
      else if (!/\d/.test(form.password)) errors.password = 'Need a digit';
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errors.password = 'Need a special character';

      if (!form.confirmPassword) errors.confirmPassword = 'Please confirm password';
      else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords don\'t match';
    }

    if (s === 3) {
      if (!form.agreeTerms) errors.agreeTerms = 'You must agree to the terms';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep(step + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      const result = await signup(form.name, form.email, form.password);
      navigate('/auth/verify', {
        state: { email: form.email, name: form.name, emailSent: result.emailSent }
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
      if (err.message?.includes('already exists')) {
        setStep(1);
        setDirection(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.isNewUser) navigate('/profile-setup');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      {/* Brand */}
      <div className="brand">
        <motion.div className="brand-logo" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          NutriAI
        </motion.div>
        <div className="brand-tagline">Intelligent Nutrition</div>
        <div className="brand-subtitle">Create your account</div>
      </div>

      {/* Step Indicator */}
      <div className="steps">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`} />
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.div className="alert alert-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <HiExclamationCircle className="alert-icon" />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Name & Email */}
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
              {/* Google first */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-up failed')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  width="380"
                  text="signup_with"
                />
              </div>

              <div className="divider"><span>or</span></div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon"><HiOutlineUser /></span>
                  <input
                    id="signup-name"
                    type="text"
                    name="name"
                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.name && <div className="form-error"><HiExclamationCircle /> {fieldErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><HiOutlineMail /></span>
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.email && <div className="form-error"><HiExclamationCircle /> {fieldErrors.email}</div>}
              </div>

              <motion.button type="button" className="btn btn-primary mt-md" onClick={nextStep} whileTap={{ scale: 0.98 }}>
                Continue <HiArrowRight />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">Create Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><HiOutlineLockClosed /></span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                {fieldErrors.password && <div className="form-error"><HiExclamationCircle /> {fieldErrors.password}</div>}

                {/* Password Strength */}
                {form.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`strength-segment ${passwordStrength.score >= i ? `active s${i}` : ''}`} />
                      ))}
                    </div>
                    <div className={`strength-label s${passwordStrength.score}`}>{passwordStrength.label}</div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon"><HiOutlineLockClosed /></span>
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button type="button" className="input-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <div className="form-error"><HiExclamationCircle /> {fieldErrors.confirmPassword}</div>}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button type="button" className="btn btn-secondary" onClick={prevStep} whileTap={{ scale: 0.98 }} style={{ width: 'auto', padding: '14px 24px' }}>
                  <HiArrowLeft />
                </motion.button>
                <motion.button type="button" className="btn btn-primary" onClick={nextStep} whileTap={{ scale: 0.98 }}>
                  Continue <HiArrowRight />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Terms & Submit */}
          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  Almost there!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  We'll send a verification code to <strong style={{ color: 'var(--accent-cyan)' }}>{form.email}</strong> to confirm your account.
                </p>
              </div>

              <div className="form-group">
                <label className="checkbox-wrapper" style={{ justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    className="checkbox-input"
                    checked={form.agreeTerms}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  </span>
                  <span className="checkbox-label">
                    I agree to the <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-cyan)' }}>Terms of Service</a> and <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-cyan)' }}>Privacy Policy</a>
                  </span>
                </label>
                {fieldErrors.agreeTerms && <div className="form-error" style={{ justifyContent: 'center' }}><HiExclamationCircle /> {fieldErrors.agreeTerms}</div>}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <motion.button type="button" className="btn btn-secondary" onClick={prevStep} whileTap={{ scale: 0.98 }} style={{ width: 'auto', padding: '14px 24px' }}>
                  <HiArrowLeft />
                </motion.button>
                <motion.button type="submit" className="btn btn-primary" disabled={loading} whileTap={{ scale: 0.98 }}>
                  {loading ? <div className="btn-spinner" /> : <><HiCheck /> Create Account</>}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link to="/auth/login">Sign in</Link>
      </div>
    </div>
  );
}
