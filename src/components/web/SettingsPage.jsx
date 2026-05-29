/**
 * SettingsPage — Account settings with password change for NutriAI.
 * Premium glassmorphism design.
 */

import { useState, useEffect } from 'react';
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
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineVolumeUp,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Reminders Configuration State
  const [reminders, setReminders] = useState({
    enabled: false,
    breakfast: { time: '08:00', enabled: false },
    lunch: { time: '13:00', enabled: false },
    dinner: { time: '20:00', enabled: false },
    snacks: { time: '16:00', enabled: false },
    drinks: { time: '10:00', enabled: false },
  });
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [savingReminders, setSavingReminders] = useState(false);
  const [remindersSuccess, setRemindersSuccess] = useState('');
  const [remindersError, setRemindersError] = useState('');

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await authApi.getReminders();
        if (data?.reminders) {
          setReminders(data.reminders);
        }
      } catch (err) {
        console.error('Failed to load reminders:', err);
      } finally {
        setLoadingReminders(false);
      }
    };
    loadReminders();
  }, []);

  const handleSaveReminders = async (e) => {
    e.preventDefault();
    setSavingReminders(true);
    setRemindersSuccess('');
    setRemindersError('');
    try {
      if (reminders.enabled && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setRemindersError('Notification permission denied. Please allow notifications in browser settings.');
          setSavingReminders(false);
          return;
        }
      }

      await authApi.updateReminders(reminders);
      setRemindersSuccess('Reminders updated successfully!');
      
      if (reminders.enabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification("✨ NutriAI Reminders Active!", {
          body: "Your meal and hydration reminders are configured perfectly!",
          icon: "/vite.svg"
        });
      }
    } catch (err) {
      setRemindersError(err.message || 'Failed to save reminders.');
    } finally {
      setSavingReminders(false);
    }
  };

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

        {/* Meal & Hydration Reminders Section */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: '24px' }}
        >
          <div className="settings-card-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineClock size={20} className="text-cyan" />
              <h2>Meal & Hydration Reminders</h2>
            </div>
            <div className="reminder-toggle-wrapper">
              <label className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {reminders.enabled ? 'Reminders Enabled' : 'Reminders Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={reminders.enabled}
                  onChange={(e) => setReminders({ ...reminders, enabled: e.target.checked })}
                  style={{ display: 'none' }}
                />
                <div className={`switch-track ${reminders.enabled ? 'active' : ''}`} style={{
                  width: '40px',
                  height: '20px',
                  borderRadius: '10px',
                  background: reminders.enabled ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}>
                  <div className="switch-thumb" style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: reminders.enabled ? '22px' : '2px',
                    transition: 'all 0.3s'
                  }} />
                </div>
              </label>
            </div>
          </div>

          <p className="welcome-sub" style={{ fontSize: '13px', marginBottom: '20px', marginTop: '4px' }}>
            Configure local push notifications to stay on top of your daily nutrition protocol.
          </p>

          <AnimatePresence mode="wait">
            {remindersSuccess && (
              <motion.div
                key="reminders-success"
                className="alert alert-success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <HiOutlineCheckCircle className="alert-icon" />
                <span>{remindersSuccess}</span>
              </motion.div>
            )}
            {remindersError && (
              <motion.div
                key="reminders-error"
                className="alert alert-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <HiOutlineExclamationCircle className="alert-icon" />
                <span>{remindersError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingReminders ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <div className="btn-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <form onSubmit={handleSaveReminders} className="settings-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: reminders.enabled ? 1 : 0.5, pointerEvents: reminders.enabled ? 'all' : 'none', transition: 'all 0.3s' }}>
                {[
                  { key: 'breakfast', label: 'Breakfast Reminder', icon: '🍳', desc: 'Morning fuel alert' },
                  { key: 'lunch', label: 'Lunch Reminder', icon: '🥗', desc: 'Mid-day nutrition boost' },
                  { key: 'dinner', label: 'Dinner Reminder', icon: '🍽️', desc: 'Evening meal recovery' },
                  { key: 'snacks', label: 'Snacks Reminder', icon: '🥜', desc: 'Healthy energy bites' },
                  { key: 'drinks', label: 'Hydration Reminder', icon: '💧', desc: 'Water intake target' }
                ].map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.desc}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="time"
                        value={reminders[item.key]?.time || '08:00'}
                        onChange={(e) => setReminders({
                          ...reminders,
                          [item.key]: { ...reminders[item.key], time: e.target.value }
                        })}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={reminders[item.key]?.enabled || false}
                          onChange={(e) => setReminders({
                            ...reminders,
                            [item.key]: { ...reminders[item.key], enabled: e.target.checked }
                          })}
                          style={{ display: 'none' }}
                        />
                        <div className={`switch-track ${reminders[item.key]?.enabled ? 'active' : ''}`} style={{
                          width: '32px',
                          height: '16px',
                          borderRadius: '8px',
                          background: reminders[item.key]?.enabled ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                          position: 'relative',
                          transition: 'all 0.3s'
                        }}>
                          <div className="switch-thumb" style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '2px',
                            left: reminders[item.key]?.enabled ? '18px' : '2px',
                            transition: 'all 0.3s'
                          }} />
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary"
                disabled={savingReminders}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: '20px', width: 'auto', padding: '12px 32px' }}
              >
                {savingReminders ? (
                  <>
                    <div className="btn-spinner" />
                    Saving Reminders...
                  </>
                ) : (
                  <>
                    <HiOutlineVolumeUp size={18} />
                    Save & Test Reminders
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.section>
      </main>

      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
