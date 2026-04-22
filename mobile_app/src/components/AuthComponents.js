import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Dimensions,
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';

const { width } = Dimensions.get('window');

export const PremiumBackground = ({ children }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.gradients.dark}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative Orbs - Parity with Web index.css */}
      <View style={styles.nebula1} />
      <View style={styles.nebula2} />
      <View style={styles.nebula3} />
      
      {children}
    </View>
  );
};

export const GlassInput = ({ icon, ...props }) => {
  return (
    <View style={styles.inputWrapper}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.textTertiary}
        {...props}
      />
    </View>
  );
};

export const PremiumButton = ({ title, onPress, loading, variant = 'primary' }) => {
  const isSecondary = variant === 'secondary';
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={loading}
    >
      <LinearGradient
        colors={isSecondary ? COLORS.gradients.surface : COLORS.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, isSecondary && styles.secondaryButton]}
      >
        <Text style={[styles.buttonText, isSecondary && styles.secondaryButtonText]}>
          {loading ? 'Processing...' : title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const SocialButton = ({ title, onPress, icon = 'logo-google' }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={styles.socialButton}
    >
      <Ionicons name={icon} size={20} color={COLORS.text} style={styles.socialIcon} />
      <Text style={styles.socialText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  nebula1: {
    position: 'absolute',
    top: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    // filter: 'blur(100px)', // Unsupported, using opacity and size
  },
  nebula2: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
  },
  nebula3: {
    position: 'absolute',
    top: '40%',
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  iconWrapper: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 18,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  secondaryButtonText: {
    color: COLORS.text,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 244, 255, 0.03)',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
