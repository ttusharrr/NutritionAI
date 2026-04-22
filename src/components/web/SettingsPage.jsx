/**
 * SettingsPage — Account settings with password change for NutriAI.
 * Premium glassmorphism design.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isGoogleOnly = user?.auth_provider === 'google' && !user?.password_hash;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.changePassword(currentPassword, newPassword);
      setSuccess(data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return score;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strength = getPasswordStrength(newPassword);

  return (
    <div className="dashboard-scene">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <motion.div
            className="brand-logo"
            style={{ fontSize: '24px' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            NutriAI
          </motion.div>
          <button
            className="region-btn"
            onClick={() => navigate(-1)}
            style={{ gap: '8px' }}
          >
            <HiOutlineArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-main" style={{ maxWidth: '720px' }}>
        <motion.header
          className="welcome-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="greeting">Settings</h1>
          <p className="welcome-sub">Manage your account and security preferences.</p>
        </motion.header>

        {/* Profile Info Card */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="settings-card-header">
            <HiOutlineUser size={20} />
            <h2>Account Information</h2>
          </div>
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <span className="settings-info-label">Name</span>
              <span className="settings-info-value">{user?.name || 'N/A'}</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">Email</span>
              <span className="settings-info-value">
                <HiOutlineMail size={14} style={{ marginRight: '6px', opacity: 0.5 }} />
                {user?.email || 'N/A'}
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">Auth Method</span>
              <span className="settings-info-value" style={{ textTransform: 'capitalize' }}>
                {user?.auth_provider || 'Local'}
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-label">Member Since</span>
              <span className="settings-info-value">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Change Password Section */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="settings-card-header">
            <HiOutlineShieldCheck size={20} />
            <h2>Change Password</h2>
          </div>

          {isGoogleOnly && (
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              <HiOutlineExclamationCircle className="alert-icon" />
              <span>Your account uses Google Sign-In. Set a password here to enable email login too.</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                key="success"
                className="alert alert-success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <HiOutlineCheckCircle className="alert-icon" />
                <span>{success}</span>
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error"
                className="alert alert-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <HiOutlineExclamationCircle className="alert-icon" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleChangePassword} className="settings-form">
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineLockClosed /></span>
                <input
                  id="settings-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  placeholder={isGoogleOnly ? 'Leave blank for Google accounts' : 'Enter current password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={!isGoogleOnly}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineLockClosed /></span>
                <input
                  id="settings-new-password"
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              {/* Password Strength */}
              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`strength-segment ${strength >= i ? `active s${i}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className={`strength-label s${strength}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineLockClosed /></span>
                <input
                  id="settings-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className={`form-input ${confirmPassword && newPassword !== confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="form-error">
                  <HiOutlineExclamationCircle />
                  <span>Passwords do not match</span>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <div className="btn-spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck size={18} />
                  Update Password
                </>
              )}
            </motion.button>
          </form>
        </motion.section>
      </main>

      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
