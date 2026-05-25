import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '../utils/GoogleSigninSafe';
import { COLORS, SPACING } from '../theme/colors';
import { login, loginWithGoogle, reportClientError } from '../api/authApi';
import { CONFIG } from '../constants/Config';
import { PremiumBackground, GlassInput, PremiumButton, SocialButton } from '../components/AuthComponents';

// Configure Google Sign-In once
GoogleSignin.configure({
  webClientId: CONFIG.EXPO_CLIENT_ID,
  offlineAccess: true,
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // Dynamic server wake-up/loading message timer
  useEffect(() => {
    let timer1, timer2, timer3, timer4;
    if (loading) {
      setStatusMessage('Connecting to secure servers...');
      
      timer1 = setTimeout(() => {
        setStatusMessage('Waking up cloud database...');
      }, 3000);

      timer2 = setTimeout(() => {
        setStatusMessage('Establishing encrypted connection...');
      }, 7000);

      timer3 = setTimeout(() => {
        setStatusMessage('Optimizing routes (Render cold-start)...');
      }, 12000);

      timer4 = setTimeout(() => {
        setStatusMessage('Finalizing authentication protocol...');
      }, 20000);
    } else {
      setStatusMessage('');
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [loading]);

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
        console.error('[Google Sign-In] No ID token returned:', JSON.stringify(userInfo));
        reportClientError('google_signin_client', 'No ID token returned from Google SDK', 'warning');
        setError('Google did not return an ID token. Please try again.');
      }
    } catch (err) {
      console.error('[Google Sign-In Error]', err.code, err.message);
      reportClientError('google_signin_client', `Code: ${err.code} | Message: ${err.message}`, 'warning');
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services not available on this device.');
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken) => {
    try {
      const result = await loginWithGoogle(idToken);
      console.log('[Google Login] Success:', result.message);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err) {
      console.error('[Google Login Backend Error]', err.response?.status, err.response?.data);
      const serverError = err.response?.data?.error;
      const details = err.response?.data?.details;
      const errMsg = serverError ? `${serverError}${details ? ` (${details})` : ''}` : (err.userMessage || err.message);
      reportClientError('google_login_backend', `Status: ${err.response?.status} | Error: ${errMsg}`, 'error');
      
      if (serverError) {
        setError(`${serverError}${details ? ` (${details})` : ''}`);
      } else if (err.userMessage) {
        setError(err.userMessage);
      } else {
        setError('Google authentication failed. Server may be temporarily unavailable.');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      if (data.requires_verification) {
        navigation.navigate('VerifyOtp', { email });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (err) {
      console.error('[Login Error]', err.response?.status, err.response?.data, err.message);
      const errMsg = err.response?.data?.error || err.userMessage || err.message;
      reportClientError('login_backend', `Email: ${email} | Status: ${err.response?.status} | Error: ${errMsg}`, 'error');
      
      if (err.response?.data?.error) {
        // Server returned a specific error message
        setError(err.response.data.error);
      } else if (err.userMessage) {
        // Custom network error message from our interceptor
        setError(err.userMessage);
      } else if (!err.response) {
        // No response at all — network/connectivity issue
        setError('Cannot reach the server. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
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
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>AI</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your intelligent dashboard</Text>
          </View>

          {/* Error Alert */}
          {error !== '' && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <GlassInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <View style={styles.passwordContainer}>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Password"
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
            
            <TouchableOpacity 
              style={styles.forgotPass} 
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PremiumButton 
              title="Sign In" 
              onPress={handleLogin} 
              loading={loading} 
            />

            {loading && statusMessage !== '' && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.line} />
            </View>

            <SocialButton 
              title="Continue with Google" 
              onPress={handleGoogleSignIn} 
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  logoText: {
    color: '#000',
    fontSize: 24,
    fontWeight: '900',
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
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPassText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
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
    marginVertical: 24,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
