import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  StatusBar, SafeAreaView, Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import DrawerMenu from './DrawerMenu';

// Lazy screens – imported normally (Expo Go doesn't support React.lazy)
import DashboardScreen from '../screens/DashboardScreen';
import DietPlanScreen from '../screens/DietPlanScreen';
import ProfileScreen from '../screens/ProfileScreen';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'home',    label: 'Home',      icon: 'home',      iconOut: 'home-outline' },
  { key: 'diet',    label: 'Diet Plan', icon: 'clipboard', iconOut: 'clipboard-outline' },
  { key: 'profile', label: 'Profile',   icon: 'person',    iconOut: 'person-outline' },
];

export default function MainTabsScreen({ navigation }) {
  const pagerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Animated indicator
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('user').then(str => {
      if (str) setUser(JSON.parse(str));
    });
  }, []);

  const goToTab = useCallback((index) => {
    pagerRef.current?.setPage(index);
    setActiveTab(index);
    Animated.spring(indicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  const onPageSelected = useCallback((e) => {
    const index = e.nativeEvent.position;
    setActiveTab(index);
    Animated.spring(indicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  const tabWidth = width / TABS.length;
  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* WhatsApp-style Top Bar */}
      <SafeAreaView style={styles.topBarSafe}>
        <View style={styles.topBar}>
          <Text style={styles.brandText}>
            Nutri<Text style={{ color: COLORS.primary }}>AI</Text>
          </Text>

          {/* Tab Labels */}
          <View style={styles.tabRow}>
            {TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => goToTab(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Animated Indicator */}
          <View style={styles.indicatorTrack}>
            <Animated.View
              style={[
                styles.indicator,
                { width: tabWidth - 32, transform: [{ translateX: indicatorTranslate }] },
              ]}
            />
          </View>

          {/* Hamburger → opens right drawer */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Swipeable Page Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        overdrag
      >
        <View key="home" style={styles.page}>
          <DashboardScreen navigation={navigation} isTab />
        </View>
        <View key="diet" style={styles.page}>
          <DietPlanScreen navigation={navigation} isTab />
        </View>
        <View key="profile" style={styles.page}>
          <ProfileScreen navigation={navigation} isTab />
        </View>
      </PagerView>

      {/* Right Drawer */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBarSafe: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  brandText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
    paddingVertical: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  indicatorTrack: {
    height: 3,
    flexDirection: 'row',
    marginHorizontal: 0,
    marginBottom: 0,
  },
  indicator: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginLeft: 16,
  },
  menuBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    padding: 8,
    gap: 4,
    alignItems: 'center',
  },
  menuDot: {
    width: 18,
    height: 2.5,
    backgroundColor: COLORS.textSecondary,
    borderRadius: 2,
    marginVertical: 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
