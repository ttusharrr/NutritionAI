/**
 * LoginPage — Email/password login with Google OAuth.
 * Features: account lockout feedback, unverified redirect, remember me.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(form.email, form.password, rememberMe);

      if (result.requiresVerification) {
        navigate('/auth/verify', { state: { email: result.email } });
      } else if (result.success) {
        if (!result.user?.profile_completed) {
          navigate('/profile-setup');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.isNewUser) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
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
        <motion.div
          className="brand-logo"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          NutriAI
        </motion.div>
        <div className="brand-tagline">Intelligent Nutrition</div>
        <div className="brand-subtitle">Welcome back! Sign in to continue.</div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          className="alert alert-error"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiExclamationCircle className="alert-icon" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Google Sign In */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google sign-in failed')}
          theme="filled_black"
          shape="pill"
          size="large"
          width="380"
          text="continue_with"
        />
      </div>

      <div className="divider"><span>or</span></div>

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email</label>
          <div className="input-wrapper">
            <span className="input-icon"><HiOutlineMail /></span>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <span className="input-icon"><HiOutlineLockClosed /></span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
            </button>
          </div>
        </div>

        <div className="auth-link-row">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-custom">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 6 5 9 10 3" />
              </svg>
            </span>
            <span className="checkbox-label">Remember me</span>
          </label>

          <Link to="/auth/forgot-password" className="btn-ghost">
            Forgot password?
          </Link>
        </div>

        <motion.button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <div className="btn-spinner" /> : 'Sign In'}
        </motion.button>
      </form>

      <div className="auth-footer">
        Don't have an account?{' '}
        <Link to="/auth/signup">Create one</Link>
      </div>
    </div>
  );
}
