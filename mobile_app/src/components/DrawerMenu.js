import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Modal, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { logout } from '../api/authApi';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.72;

export default function DrawerMenu({ visible, onClose, navigation, user }) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: DRAWER_WIDTH,
          useNativeDriver: true,
          tension: 80,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          onClose();
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Landing' }],
          });
        },
      },
    ]);
  };

  const navigate = (screen) => {
    onClose();
    setTimeout(() => navigation.navigate(screen), 150);
  };

  const firstName = user?.name?.split(' ')[0] || 'Explorer';
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer panel slides in from right */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* User Hero */}
        <LinearGradient
          colors={['rgba(45,212,191,0.15)', 'rgba(45,212,191,0.02)']}
          style={styles.drawerHero}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.drawerName}>{firstName}</Text>
          <Text style={styles.drawerEmail} numberOfLines={1}>{user?.email || ''}</Text>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuList}>
          <DrawerItem
            icon="person-outline"
            label="My Profile"
            onPress={() => navigate('Profile')}
          />
          <DrawerItem
            icon="settings-outline"
            label="Settings"
            onPress={() => navigate('Settings')}
          />
          <DrawerItem
            icon="information-circle-outline"
            label="About NutriAI"
            onPress={() => navigate('About')}
          />
          <DrawerItem
            icon="chatbubble-ellipses-outline"
            label="AI Nutritionist"
            onPress={() => navigate('Chat')}
          />
        </View>

        <View style={styles.divider} />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.7}>
          <View style={styles.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

function DrawerItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingBottom: 40,
  },
  drawerHero: {
    padding: 28,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  drawerName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  drawerEmail: {
    color: COLORS.textTertiary,
    fontSize: 13,
    marginTop: 3,
  },
  menuList: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(45,212,191,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginVertical: 12,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
