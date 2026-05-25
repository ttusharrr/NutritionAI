import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { forgotPassword } from '../api/authApi';
import { PremiumBackground, GlassInput, PremiumButton } from '../components/AuthComponents';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      console.error('[ForgotPassword Error]', err.response?.status, err.response?.data, err.message);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.userMessage) {
        setError(err.userMessage);
      } else if (!err.response) {
        setError('Cannot reach the server. Please check your internet connection.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {sent ? (
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={40} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successText}>
                If an account exists for{' '}
                <Text style={styles.emailHighlight}>{email}</Text>
                , we've sent a password reset link. The link expires in 1 hour.
              </Text>
              <Text style={styles.spamText}>
                Didn't receive it? Check your spam folder.
              </Text>

              <TouchableOpacity 
                style={styles.tryAgainBtn}
                onPress={() => { setSent(false); setEmail(''); }}
              >
                <Text style={styles.tryAgainText}>Try another email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form State */
            <>
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>🔑</Text>
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  No worries. Enter your email and we'll send you a reset link.
                </Text>
              </View>

              {error !== '' && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.form}>
                <GlassInput
                  icon="mail-outline"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <PremiumButton 
                  title="Send Reset Link" 
                  onPress={handleSubmit} 
                  loading={loading} 
                />
              </View>
            </>
          )}

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
            <Text style={styles.backText}> Back to login</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
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
  form: {
    width: '100%',
  },
  /* Success State */
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  spamText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
  },
  tryAgainBtn: {
    paddingVertical: 10,
  },
  tryAgainText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  /* Back */
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
