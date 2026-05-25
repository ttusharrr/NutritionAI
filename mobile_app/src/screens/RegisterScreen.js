import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '../utils/GoogleSigninSafe';
import { COLORS, SPACING } from '../theme/colors';
import { register, loginWithGoogle } from '../api/authApi';
import { CONFIG } from '../constants/Config';
import { PremiumBackground, GlassInput, PremiumButton, SocialButton } from '../components/AuthComponents';

// Configure Google Sign-In once
GoogleSignin.configure({
  webClientId: CONFIG.EXPO_CLIENT_ID,
  offlineAccess: true,
});

function getPasswordStrength(pw) {
  let score = 0;
  if (!pw) return { score: 0, label: '' };
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#2dd4bf'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = getPasswordStrength(password);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;
      if (idToken) {
        await handleGoogleLogin(idToken);
      } else {
        setError('Google did not return an ID token. Please try again.');
      }
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services not available on this device.');
      } else {
        setError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    try {
      await loginWithGoogle(idToken);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      navigation.navigate('VerifyOtp', { email, name });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Join NutriAI</Text>
              <Text style={styles.subtitle}>Start your personalized health journey</Text>
            </View>

            {error !== '' && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              {/* Google Sign Up */}
              <SocialButton 
                title="Sign up with Google" 
                onPress={handleGoogleSignIn} 
              />

              <View style={styles.separator}>
                <View style={styles.line} />
                <Text style={styles.separatorText}>OR</Text>
                <View style={styles.line} />
              </View>

              <GlassInput
                icon="person-outline"
                placeholder="Full Name"
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
              />
              <GlassInput
                icon="mail-outline"
                placeholder="Email Address"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {/* Password with toggle */}
              <View style={styles.passwordContainer}>
                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Create Password (min 8 chars)"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeToggle} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={COLORS.textTertiary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.strengthSegment, 
                          passwordStrength.score >= i && { backgroundColor: passwordStrength.color }
                        ]} 
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              {/* Confirm Password */}
              <View style={styles.passwordContainer}>
                <GlassInput
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity 
                  style={styles.eyeToggle} 
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Ionicons 
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color={COLORS.textTertiary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Password mismatch */}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <View style={styles.mismatchRow}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                  <Text style={styles.mismatchText}>Passwords do not match</Text>
                </View>
              )}

              <View style={styles.terms}>
                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>

              <PremiumButton 
                title="Create Account" 
                onPress={handleRegister} 
                loading={loading} 
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PremiumBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
  passwordContainer: {
    position: 'relative',
  },
  eyeToggle: {
    position: 'absolute',
    right: 16,
    top: 18,
    padding: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 70,
    textAlign: 'right',
  },
  mismatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mismatchText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  terms: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  termsText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    color: COLORS.textTertiary,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
