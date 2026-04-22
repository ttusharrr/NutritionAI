import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';

const FEATURES = [
  {
    icon: 'flash',
    title: 'AI-Powered Analysis',
    desc: 'GPT-4o-mini integration for personalized dietary recommendations.',
    colors: COLORS.gradients.primary,
  },
  {
    icon: 'globe-outline',
    title: 'Regional Cuisines',
    desc: 'Authentic meals from 10+ Indian regions — Punjab, J&K, Kerala, and more.',
    colors: COLORS.gradients.secondary,
  },
  {
    icon: 'heart-outline',
    title: 'Health-First',
    desc: 'Scientifically calculated BMR, TDEE, and macro splits for your goals.',
    colors: ['#ec4899', '#db2777'],
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Secure & Private',
    desc: 'JWT authentication, encrypted data, and zero third-party sharing.',
    colors: ['#10b981', '#059669'],
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Smart Chatbot',
    desc: 'AI nutrition assistant that answers your diet questions instantly.',
    colors: ['#3b82f6', '#2563eb'],
  },
];

const TECH_STACK = [
  { name: 'React Native', role: 'Mobile App' },
  { name: 'React', role: 'Web Frontend' },
  { name: 'Flask', role: 'Backend API' },
  { name: 'MongoDB', role: 'Database' },
  { name: 'OpenAI GPT-4o', role: 'AI Engine' },
  { name: 'JWT', role: 'Auth' },
];

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView>
          {/* Header */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.navTitle}>About</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroIconContainer}>
                <Ionicons name="nutrition" size={36} color="#000" />
              </View>
              <Text style={styles.heroTitle}>NutriAI</Text>
              <Text style={styles.heroSubtitle}>
                Intelligent Nutrition, Personalized For You
              </Text>
            </LinearGradient>
          </View>

          {/* Mission */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <View style={styles.missionCard}>
              <Ionicons
                name="people-outline"
                size={24}
                color={COLORS.primary}
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.missionText}>
                We believe personalized nutrition should not be a luxury. NutriAI
                leverages AI to understand your unique body, cultural food
                preferences, and health objectives — delivering science-backed
                meal plans that actually work.
              </Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            {FEATURES.map((feat, idx) => (
              <View key={idx} style={styles.featureRow}>
                <LinearGradient
                  colors={feat.colors}
                  style={styles.featureIcon}
                >
                  <Ionicons name={feat.icon} size={18} color="#000" />
                </LinearGradient>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tech Stack */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built With</Text>
            <View style={styles.techGrid}>
              {TECH_STACK.map((tech, idx) => (
                <View key={idx} style={styles.techChip}>
                  <Text style={styles.techName}>{tech.name}</Text>
                  <Text style={styles.techRole}>{tech.role}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with ❤️ for health-conscious individuals
            </Text>
            <Text style={styles.footerVersion}>
              NutriAI v1.0.0 — © {new Date().getFullYear()}
            </Text>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: '#000',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  missionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 24,
  },
  missionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    color: COLORS.textTertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  techName: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  techRole: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 16,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  footerVersion: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
});
