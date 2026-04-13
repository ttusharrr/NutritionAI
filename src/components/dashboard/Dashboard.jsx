/**
 * Dashboard — Authenticated home screen showing user info.
 * Proves the full auth flow works end-to-end.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineLogout, HiCheck, HiOutlineShieldCheck, HiOutlineClock, HiOutlineMail, HiOutlineUser } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="dashboard-scene">
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '22px',
            fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            NutriAI
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Dashboard
          </span>
        </div>

        <motion.button
          className="btn btn-secondary"
          onClick={handleLogout}
          style={{ width: 'auto', padding: '10px 20px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineLogout /> Logout
        </motion.button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        <motion.div
          className="welcome-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Avatar */}
          <motion.div
            className="welcome-avatar"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} referrerPolicy="no-referrer" />
            ) : (
              getInitials(user?.name)
            )}
          </motion.div>

          <motion.h1
            className="welcome-name"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Welcome, {user?.name?.split(' ')[0] || 'User'}!
          </motion.h1>

          <p className="welcome-email">{user?.email}</p>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            {user?.is_verified && (
              <span className="welcome-badge">
                <HiCheck size={14} /> Verified
              </span>
            )}
            <span className="welcome-badge" style={{
              background: 'var(--accent-purple-dim)',
              borderColor: 'rgba(168,85,247,0.2)',
              color: 'var(--accent-purple)',
            }}>
              <HiOutlineShieldCheck size={14} />
              {user?.auth_provider === 'google' ? 'Google Auth' : 'Email Auth'}
            </span>
          </div>

          {/* Info Grid */}
          <motion.div
            className="info-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="info-item">
              <div className="info-item-label"><HiOutlineUser style={{ verticalAlign: 'middle' }} /> Full Name</div>
              <div className="info-item-value">{user?.name || 'N/A'}</div>
            </div>
            <div className="info-item">
              <div className="info-item-label"><HiOutlineMail style={{ verticalAlign: 'middle' }} /> Email</div>
              <div className="info-item-value" style={{ fontSize: '13px', wordBreak: 'break-all' }}>{user?.email || 'N/A'}</div>
            </div>
            <div className="info-item">
              <div className="info-item-label"><HiOutlineShieldCheck style={{ verticalAlign: 'middle' }} /> Auth Method</div>
              <div className="info-item-value" style={{ textTransform: 'capitalize' }}>{user?.auth_provider || 'local'}</div>
            </div>
            <div className="info-item">
              <div className="info-item-label"><HiOutlineClock style={{ verticalAlign: 'middle' }} /> Member Since</div>
              <div className="info-item-value">{formatDate(user?.created_at)}</div>
            </div>
          </motion.div>

          {/* Profile status */}
          {!user?.profile_completed && (
            <motion.div
              style={{ marginTop: '24px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                className="btn btn-primary"
                style={{ maxWidth: '280px' }}
                onClick={() => navigate('/profile-setup')}
                whileTap={{ scale: 0.95 }}
              >
                Complete Profile Setup
              </motion.button>
            </motion.div>
          )}

          {user?.profile_completed && user?.profile && (
            <motion.div
              style={{ marginTop: '24px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div style={{
                display: 'inline-flex', gap: '6px', alignItems: 'center',
                padding: '10px 24px', borderRadius: 'var(--radius-full)',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--success)', fontSize: '13px', fontWeight: 600,
              }}>
                <HiCheck size={16} /> Profile Complete
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
