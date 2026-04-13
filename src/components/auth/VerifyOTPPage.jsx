/**
 * VerifyOTPPage — 6-digit OTP verification with auto-focus and countdown.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiExclamationCircle, HiCheck } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP } = useAuth();

  const email = location.state?.email || '';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate('/auth/signup');
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInput = useCallback((index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (paste.length === 0) return;

    const newOtp = [...otp];
    paste.split('').forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(paste.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();

    if (paste.length === OTP_LENGTH) {
      handleVerify(paste);
    }
  }, [otp]);

  const handleVerify = async (code) => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(email, code);
      setSuccess('Email verified successfully!');

      setTimeout(() => {
        if (!result.user?.profile_completed) {
          navigate('/profile-setup');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid verification code');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await authApi.resendOTP(email);
      setCanResend(false);
      setCountdown(RESEND_COOLDOWN);
      setError('');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setSuccess('New code sent! Check your email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="success-icon">
            <HiCheck size={40} />
          </div>
          <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: '16px', fontWeight: 600 }}>
            {success}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Email display */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 20px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-cyan-dim)', border: '1px solid rgba(45,212,191,0.15)',
              fontSize: '13px', color: 'var(--accent-cyan)',
            }}>
              <HiOutlineMail /> {email}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', margin: '12px 0 0 0', lineHeight: '1.6' }}>
            Enter the 6-digit verification code sent to your email
          </p>

          {error && (
            <motion.div className="alert alert-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px' }}>
              <HiExclamationCircle className="alert-icon" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* OTP Inputs */}
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <motion.input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              />
            ))}
          </div>

          <motion.button
            type="button"
            className="btn btn-primary"
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            onClick={() => handleVerify(otp.join(''))}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <div className="btn-spinner" /> : 'Verify Email'}
          </motion.button>

          {/* Resend */}
          <div className="countdown">
            {canResend ? (
              <button className="btn-ghost" onClick={handleResend} style={{ fontSize: '14px' }}>
                Resend verification code
              </button>
            ) : (
              <span>
                Resend code in <span className="countdown-time">{formatTime(countdown)}</span>
              </span>
            )}
          </div>
        </>
      )}

      <div className="auth-footer" style={{ marginTop: '24px' }}>
        <Link to="/auth/login" style={{ fontSize: '13px' }}>← Back to login</Link>
      </div>
    </div>
  );
}
