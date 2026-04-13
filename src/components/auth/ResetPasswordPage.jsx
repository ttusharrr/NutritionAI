/**
 * ResetPasswordPage — Set a new password using the reset token from email.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiExclamationCircle, HiCheck } from 'react-icons/hi';
import authApi from '../../api/authApi';

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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(form.password);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [token, email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.password) {
      setError('Please enter a new password');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords don\'t match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(email, token, form.password);
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-card">
      <div className="brand">
        <motion.div className="brand-logo" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          NutriAI
        </motion.div>
        <div className="brand-tagline">Intelligent Nutrition</div>
      </div>

      {success ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="success-icon">
            <HiCheck size={40} />
          </div>
          <h3 style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            Password Reset Successfully!
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Redirecting you to login...
          </p>
        </motion.div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Create New Password
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Your new password must be different from your previous password.
            </p>
          </div>

          {error && (
            <motion.div className="alert alert-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <HiExclamationCircle className="alert-icon" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineLockClosed /></span>
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading || (!token || !email)}
                />
                <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>

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
              <label className="form-label" htmlFor="reset-confirm">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineLockClosed /></span>
                <input
                  id="reset-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading || (!token || !email)}
                />
                <button type="button" className="input-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !token || !email}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <div className="btn-spinner" /> : 'Reset Password'}
            </motion.button>
          </form>
        </>
      )}

      <div className="auth-footer">
        <Link to="/auth/login">← Back to login</Link>
      </div>
    </div>
  );
}
