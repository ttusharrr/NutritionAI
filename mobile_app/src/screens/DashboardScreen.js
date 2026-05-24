import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { getRecommendations } from '../api/authApi';
import authApi from '../api/authApi';

const REGIONS = [
  { id: 'Punjab', label: 'Punjab', icon: '🌾' },
  { id: 'J&K', label: 'Jammu & Kashmir', icon: '🏔️' },
  { id: 'Himachal', label: 'Himachal Pradesh', icon: '🌲' },
  { id: 'Tamil Nadu', label: 'Tamil Nadu', icon: '🛕' },
  { id: 'Maharashtra', label: 'Maharashtra', icon: '🦁' },
  { id: 'Gujarat', label: 'Gujarat', icon: '🌊' },
  { id: 'West Bengal', label: 'West Bengal', icon: '🐯' },
  { id: 'Karnataka', label: 'Karnataka', icon: '🐘' },
  { id: 'Kerala', label: 'Kerala', icon: '🌴' },
  { id: 'Delhi', label: 'Delhi', icon: '🏛️' },
  { id: 'International', label: 'International', icon: '🌍' },
];

export default function DashboardScreen({ navigation, isTab }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        if (!userData.profile_completed || !userData.profile?.age) {
          navigation.navigate('ProfileSetup');
          return;
        }
      }
      const response = await getRecommendations();
      setData(response);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRegionChange = async (regionId) => {
    setRegionModalVisible(false);
    try {
      const response = await authApi.post('/auth/update-region', { region: regionId });
      if (response.data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
      setRefreshing(true);
      loadData();
    } catch (err) {
      console.error('Failed to update region:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const targets = data?.user_targets || user?.daily_nutrition || { daily_calories: 2000, macros: { protein: 0, carbs: 0, fat: 0 }};
  const bmiData = targets.bmi_data || user?.daily_nutrition?.bmi_data || { value: 0, status: 'N/A' };
  const currentRegion = REGIONS.find(r => r.id === (user?.profile?.region)) || REGIONS[0];
  const firstName = user?.name?.split(' ')[0] || 'Explorer';
  const getBMIColor = useCallback((status) => {
    switch (status) {
      case 'Underweight': return '#fbbf24';
      case 'Normal': return '#22c55e';
      case 'Overweight': return '#f97316';
      case 'Obese': return '#ef4444';
      default: return COLORS.textTertiary;
    }
  }, []);

  const getBMIPosition = useCallback((value) => {
    return Math.min(Math.max(((value || 0) - 15) / 25 * 100, 2), 98);
  }, []);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Nebula Background - Parity with Web */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.nebula1} />
        <View style={styles.nebula2} />
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <SafeAreaView>
          {/* Greeting Bar (no logout - it's in the drawer now) */}
          <View style={styles.navBar}>
            <View>
              <Text style={styles.greetingTitle}>Welcome back, {firstName} 👋</Text>
            </View>
          </View>

          {/* Region Selector */}
          <TouchableOpacity 
            style={styles.regionSelector}
            onPress={() => setRegionModalVisible(true)}
          >
            <Ionicons name="globe-outline" size={18} color={COLORS.primary} />
            <Text style={styles.regionText}>{currentRegion.icon} {currentRegion.label}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textTertiary} />
          </TouchableOpacity>

          {/* Calorie Hero - Parity with Web */}
          <View style={styles.missionHero}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.cardFlare} />
              <View style={styles.heroInfo}>
                <Text style={styles.cardLabel}>Daily Target</Text>
                <View style={styles.calorieRow}>
                  <Ionicons name="flame" size={32} color="#000" style={{ opacity: 0.9 }} />
                  <Text style={styles.energyVal}>{targets.daily_calories.toLocaleString()}</Text>
                </View>
                <Text style={styles.cardUnit}>kcal / day</Text>
              </View>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>
                  {user?.profile?.dietary_goal?.replace('_', ' ') || 'MAINTAIN'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Macro Grid - Parity with Web */}
          <View style={styles.gridContainer}>
            <Text style={styles.sectionTitle}>Macro Breakdown</Text>
            <View style={styles.macroGrid}>
              <MacroTile 
                label="PROTEIN" 
                value={targets.macros.protein} 
                unit="g" 
                icon="flash" 
                colors={['rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.05)']} 
                accent={COLORS.primary}
              />
              <MacroTile 
                label="CARBS" 
                value={targets.macros.carbs} 
                unit="g" 
                icon="cube" 
                colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']} 
                accent={COLORS.secondary}
              />
              <MacroTile 
                label="FATS" 
                value={targets.macros.fat} 
                unit="g" 
                icon="heart" 
                colors={['rgba(236, 72, 153, 0.15)', 'rgba(236, 72, 153, 0.05)']} 
                accent="#ec4899"
              />
            </View>
          </View>

          {/* BMI Strip - Parity with Web */}
          <View style={styles.bmiSection}>
            <Text style={styles.sectionTitle}>Body Mass Index (BMI)</Text>
            <View style={styles.bmiStripCard}>
              <View style={styles.bmiInfoRow}>
                <View>
                  <Text style={styles.bmiValue}>{bmiData.value || '0.0'}</Text>
                </View>
                <View style={[styles.bmiStatusTag, { backgroundColor: getBMIColor(bmiData.status) + '20', borderColor: getBMIColor(bmiData.status) + '40' }]}>
                  <Text style={[styles.bmiStatusTagText, { color: getBMIColor(bmiData.status) }]}>
                    {bmiData.status || 'Calculating'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bmiVisualMeter}>
                <View style={styles.meterSegments}>
                  <View style={[styles.segment, { backgroundColor: '#f59e0b', flex: 1 }]} />
                  <View style={[styles.segment, { backgroundColor: '#10b981', flex: 2 }]} />
                  <View style={[styles.segment, { backgroundColor: '#ec4899', flex: 1 }]} />
                  <View style={[styles.segment, { backgroundColor: '#ef4444', flex: 1.5 }]} />
                </View>
                <View style={styles.meterPointerTrack}>
                  <View style={[styles.meterPointer, { marginLeft: `${getBMIPosition(bmiData.value)}%` }]} />
                </View>
                <View style={styles.meterLabels}>
                  <Text style={styles.meterLabelText}>15</Text>
                  <Text style={styles.meterLabelText}>18.5</Text>
                  <Text style={styles.meterLabelText}>25</Text>
                  <Text style={styles.meterLabelText}>30</Text>
                  <Text style={styles.meterLabelText}>40+</Text>
                </View>
              </View>
            </View>
          </View>

        </SafeAreaView>
      </ScrollView>

      {/* Chat FAB */}
      <TouchableOpacity 
        style={styles.chatFab}
        onPress={() => navigation.navigate('Chat')}
      >
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.chatFabGradient}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#000" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Region Modal */}
      <Modal
        visible={regionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setRegionModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Regional Cuisine</Text>
            <ScrollView style={styles.regionList}>
              {REGIONS.map(region => (
                <TouchableOpacity
                  key={region.id}
                  style={[styles.regionItem, currentRegion.id === region.id && styles.regionItemActive]}
                  onPress={() => handleRegionChange(region.id)}
                >
                  <Text style={styles.regionItemIcon}>{region.icon}</Text>
                  <Text style={[styles.regionItemText, currentRegion.id === region.id && styles.regionItemTextActive]}>
                    {region.label}
                  </Text>
                  {currentRegion.id === region.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function MacroTile({ label, value, unit, icon, colors, accent }) {
  return (
    <View style={styles.macroTileWrapper}>
      <View style={[styles.macroTile, { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1 }]}>
        <View style={[styles.macroIconContainer, { backgroundColor: accent + '15' }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <View style={styles.macroContent}>
          <Text style={styles.macroLabel}>{label}</Text>
          <View style={styles.macroValueContainer}>
            <Text style={styles.macroValue}>{value}</Text>
            <Text style={styles.macroUnit}>{unit}</Text>
          </View>
        </View>
        {/* Progress Fill - Parity with Web */}
        <View style={styles.macroProgressBg}>
          <View style={[styles.macroProgressFill, { backgroundColor: accent, height: '65%' }]} />
        </View>
      </View>
    </View>
  );
}

function StatItem({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  brandText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  greetingTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  nebula1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
  },
  nebula2: {
    position: 'absolute',
    bottom: 200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(168, 85, 247, 0.04)',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  /* Region Selector */
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  regionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  /* Calorie Hero */
  missionHero: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 28,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardFlare: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroInfo: {
    flex: 1,
  },
  cardLabel: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  energyVal: {
    color: '#000',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cardUnit: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 12,
    fontWeight: '700',
  },
  goalBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  goalBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  /* Grid */
  gridContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroTileWrapper: {
    width: '31%',
  },
  macroTile: {
    padding: 14,
    borderRadius: 20,
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  macroIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroContent: {
    flex: 1,
  },
  macroLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  macroValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  macroUnit: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  macroProgressBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  macroProgressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 2,
  },
  /* BMI Strip - Parity with Web */
  bmiSection: {
    marginBottom: 32,
  },
  bmiStripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
  },
  bmiInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  bmiValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
  },
  bmiStatusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  bmiStatusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bmiVisualMeter: {
    marginTop: 8,
  },
  meterSegments: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    borderRadius: 3,
  },
  meterPointerTrack: {
    position: 'relative',
    height: 14,
    marginTop: -4,
    marginBottom: 4,
    flexDirection: 'row',
  },
  meterPointer: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.text,
    borderWidth: 3,
    borderColor: COLORS.surface,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  meterLabelText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  /* Chat FAB */
  chatFab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 100,
  },
  chatFabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  /* Region Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '70%',
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  regionList: {
    paddingHorizontal: 20,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionItemActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  regionItemIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  regionItemText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  regionItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
