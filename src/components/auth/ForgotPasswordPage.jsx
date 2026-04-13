/**
 * ForgotPasswordPage — Request a password reset link via email.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiExclamationCircle, HiCheck } from 'react-icons/hi';
import authApi from '../../api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
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

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="success-icon">
            <HiCheck size={40} />
          </div>
          <h3 style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
            Check Your Email
          </h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            If an account exists for <strong style={{ color: 'var(--accent-cyan)' }}>{email}</strong>, we've sent a password reset link. The link expires in 1 hour.
          </p>
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', lineHeight: 1.5 }}>
            Didn't receive it? Check your spam folder or{' '}
            <button
              className="btn-ghost"
              onClick={() => { setSent(false); setEmail(''); }}
              style={{ display: 'inline' }}
            >
              try another email
            </button>
          </p>
        </motion.div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Forgot Password?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              No worries. Enter your email and we'll send you a reset link.
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
              <label className="form-label" htmlFor="forgot-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><HiOutlineMail /></span>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <div className="btn-spinner" /> : 'Send Reset Link'}
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
