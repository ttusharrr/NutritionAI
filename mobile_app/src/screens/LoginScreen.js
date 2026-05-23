import React, { useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { COLORS, SPACING } from '../theme/colors';
import { login, loginWithGoogle } from '../api/authApi';
import { CONFIG } from '../constants/Config';
import { PremiumBackground, GlassInput, PremiumButton, SocialButton } from '../components/AuthComponents';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: CONFIG.ANDROID_CLIENT_ID,
    iosClientId: CONFIG.IOS_CLIENT_ID,
    webClientId: CONFIG.EXPO_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.idToken);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken) => {
    setLoading(true);
    try {
      await loginWithGoogle(idToken);
      navigation.replace('Main');
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed');
    } finally {
      setLoading(false);
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
        navigation.replace('Main');
      }
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

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.line} />
            </View>

            <SocialButton 
              title="Continue with Google" 
              onPress={() => promptAsync()} 
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
});
