import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Animated, 
  StatusBar,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const orbScale = useRef(new Animated.Value(0.8)).current;
  const slideTexture = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(orbScale, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(slideTexture, {
          toValue: 1,
          duration: 25000,
          easing: t => t,
          useNativeDriver: true,
        })
      )
    ]).start();
  }, []);

  const translateX = slideTexture.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width * 0.85] // Slide by half the texture width (since it repeats)
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Pure Black Deep Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#000000', '#0a0e1a']}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle glowing nebula */}
        <View style={styles.glowOrb} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Brand Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.brandTitle}>NUTRI<Text style={{ color: COLORS.primary }}>AI</Text></Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>PROTOCOL ACTIVE</Text>
            </View>
          </Animated.View>

          <View style={styles.visualContainer}>
            <View style={styles.imageWrapper}>
              <Animated.Image 
                source={require('../../assets/texture_map.png')} 
                style={[styles.heroImage, { transform: [{ translateX }] }]}
                resizeMode="cover"
              />
              
              {/* Edge Fading Gradients */}
              <LinearGradient
                colors={['#000', 'transparent', 'transparent', '#000']}
                locations={[0, 0.1, 0.9, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['#000', 'transparent', 'transparent', '#000']}
                locations={[0, 0.1, 0.9, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>

          {/* Value Prop */}
          <View style={styles.bottomSection}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.headline}>
                The Future Of{'\n'}
                <Text style={styles.gradientText}>Intelligent Dieting.</Text>
              </Text>
              <Text style={styles.subheadline}>
                Regional culinary biology powered by agentic reasoning. Optimized for your unique DNA.
              </Text>
            </Animated.View>

            {/* Actions */}
            <Animated.View style={[styles.actions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <TouchableOpacity 
                style={styles.mainBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#2dd4bf', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnGradient}
                >
                  <Text style={styles.btnText}>GET STARTED</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.secondaryBtnText}>Create Protocol Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowOrb: {
    position: 'absolute',
    top: height * 0.2,
    alignSelf: 'center',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
    filter: 'blur(100px)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowRadius: 5,
    shadowOpacity: 1,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  imageWrapper: {
    width: width,
    height: width * 0.7,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  heroImage: {
    width: width * 2,
    height: '100%',
    opacity: 0.85,
  },
  bottomSection: {
    marginBottom: 20,
  },
  headline: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 42,
    letterSpacing: -1.5,
  },
  gradientText: {
    color: COLORS.primary,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    lineHeight: 22,
    maxWidth: '90%',
  },
  actions: {
    marginTop: 40,
    gap: 16,
  },
  mainBtn: {
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  btnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryBtn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
});
