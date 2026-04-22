import React, { useState, useEffect } from 'react';
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
import { getRecommendations, logout } from '../api/authApi';
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

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const loadData = async () => {
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
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Landing');
  };

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

  const getBMIColor = (status) => {
    switch (status) {
      case 'Underweight': return '#fbbf24';
      case 'Normal': return '#22c55e';
      case 'Overweight': return '#f97316';
      case 'Obese': return '#ef4444';
      default: return COLORS.textTertiary;
    }
  };

  const getBMIPosition = (value) => {
    return Math.min(Math.max(((value || 0) - 15) / 25 * 100, 2), 98);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <SafeAreaView>
          {/* Nav Bar */}
          <View style={styles.navBar}>
            <View>
              <Text style={styles.greetingHeader}>PROTOCOL</Text>
              <Text style={styles.greetingTitle}>Welcome, {firstName}!</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
            </TouchableOpacity>
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

          {/* Mission Control Hero */}
          <View style={styles.missionHero}>
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.heroCard}
            >
              <View style={styles.energyCircle}>
                <View style={styles.energyInner}>
                  <Text style={styles.energyVal}>{targets.daily_calories}</Text>
                  <Text style={styles.energyLab}>KCAL</Text>
                </div>
              </View>
              <View style={styles.missionDetails}>
                <View style={styles.statusBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusText}>PROTOCOL ACTIVE</Text>
                </View>
                <Text style={styles.integrityTitle}>System Integrity: 94%</Text>
                <Text style={styles.integritySub}>Metabolic baseline optimized.</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Macro Grid */}
          <View style={styles.gridContainer}>
            <Text style={styles.sectionTitle}>Macro Distribution</Text>
            <View style={styles.macroGrid}>
              <MacroTile 
                label="PROTEIN" 
                value={targets.macros.protein} 
                unit="g" 
                icon="fitness" 
                colors={COLORS.gradients.primary} 
              />
              <MacroTile 
                label="CARBS" 
                value={targets.macros.carbs} 
                unit="g" 
                icon="fast-food" 
                colors={['#fbbf24', '#d97706']} 
              />
              <MacroTile 
                label="FATS" 
                value={targets.macros.fat} 
                unit="g" 
                icon="water" 
                colors={COLORS.gradients.secondary} 
              />
            </View>
          </View>

          {/* BMI Section */}
          <View style={styles.bmiSection}>
            <Text style={styles.sectionTitle}>Body Mass Index</Text>
            <View style={styles.bmiCard}>
              <View style={styles.bmiHeader}>
                <View>
                  <Text style={styles.bmiLabel}>BMI Score</Text>
                  <Text style={styles.bmiValue}>{bmiData.value || '0.0'}</Text>
                </View>
                <View style={[styles.bmiStatusBadge, { backgroundColor: getBMIColor(bmiData.status) + '20', borderColor: getBMIColor(bmiData.status) + '40' }]}>
                  <Text style={[styles.bmiStatusText, { color: getBMIColor(bmiData.status) }]}>
                    {bmiData.status || 'Calculating'}
                  </Text>
                </View>
              </View>
              
              {/* BMI Meter */}
              <View style={styles.bmiMeter}>
                <View style={styles.meterSegments}>
                  <View style={[styles.segment, { backgroundColor: '#fbbf24', flex: 1 }]} />
                  <View style={[styles.segment, { backgroundColor: '#22c55e', flex: 2 }]} />
                  <View style={[styles.segment, { backgroundColor: '#f97316', flex: 1 }]} />
                  <View style={[styles.segment, { backgroundColor: '#ef4444', flex: 1.5 }]} />
                </View>
                <View style={[styles.meterPointer, { left: `${getBMIPosition(bmiData.value)}%` }]} />
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

          {/* Featured Protocol Card */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Next Protocol Item</Text>
            <View style={styles.featuredCard}>
              <View style={styles.featuredHeader}>
                <View style={styles.mealTag}>
                  <Text style={styles.mealTagText}>BREAKFAST</Text>
                </View>
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.featuredMealName}>Masala Oats Protocol</Text>
              <View style={styles.featuredStats}>
                <View style={styles.featStat}>
                  <Ionicons name="flame-outline" size={14} color={COLORS.textTertiary} />
                  <Text style={styles.featStatText}>350 kcal</Text>
                </View>
                <View style={styles.featStat}>
                  <Ionicons name="fitness-outline" size={14} color={COLORS.textTertiary} />
                  <Text style={styles.featStatText}>15g Protein</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.btnSync} onPress={() => navigation.navigate('Diet')}>
                <Text style={styles.btnSyncText}>VIEW FULL PROTOCOL</Text>
                <Ionicons name="arrow-forward" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Health Protocol Checklist */}
          <View style={styles.checklistSection}>
            <Text style={styles.sectionTitle}>Health Protocol</Text>
            <View style={styles.checklistCard}>
              {[
                { label: 'Hydration Cycle (1.5L)', done: true },
                { label: 'Log Breakfast Protocol', done: true },
                { label: 'Post-Meal Circulation', done: false },
                { label: 'Nightly Recovery Logic', done: false },
              ].map((item, index) => (
                <View key={index} style={styles.checkItem}>
                  <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
                    {item.done && <Ionicons name="checkmark" size={14} color="#000" />}
                  </View>
                  <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>{item.label}</Text>
                </View>
              ))}
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

function MacroTile({ label, value, unit, icon, colors }) {
  return (
    <View style={styles.macroTileWrapper}>
      <LinearGradient colors={colors} style={styles.macroTile}>
        <Ionicons name={icon} size={20} color="#000" style={{ opacity: 0.8 }} />
        <Text style={styles.macroTileVal}>{value}<Text style={{ fontSize: 10 }}>{unit}</Text></Text>
        <Text style={styles.macroTileLabel}>{label}</Text>
      </LinearGradient>
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
    marginTop: 20,
    marginBottom: 16,
  },
  greetingHeader: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  greetingTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
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
  /* Mission Hero */
  missionHero: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 24,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  energyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  energyInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyVal: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900',
  },
  energyLab: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  missionDetails: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  integrityTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  integritySub: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  /* Featured Section */
  featuredSection: {
    marginBottom: 32,
  },
  featuredCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealTagText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  featuredMealName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  featStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featStatText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  btnSync: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnSyncText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  /* Checklist Section */
  checklistSection: {
    marginBottom: 32,
  },
  checklistCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  checkLabelDone: {
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
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
    padding: 16,
    borderRadius: 20,
    height: 110,
    justifyContent: 'space-between',
  },
  macroTileVal: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900',
  },
  macroTileLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 10,
    fontWeight: '800',
  },
  /* BMI */
  bmiSection: {
    marginBottom: 32,
  },
  bmiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bmiLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bmiValue: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
  },
  bmiStatusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bmiStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  /* BMI Meter */
  bmiMeter: {
    position: 'relative',
  },
  meterSegments: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
  segment: {
    borderRadius: 4,
  },
  meterPointer: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.text,
    borderWidth: 3,
    borderColor: COLORS.background,
    marginLeft: -8,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  meterLabelText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  /* Stats */
  profileSection: {
    marginBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  /* Chat FAB */
  chatFab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    zIndex: 100,
  },
  chatFabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  /* Region Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '60%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  regionList: {
    paddingHorizontal: 20,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 4,
  },
  regionItemActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  regionItemIcon: {
    fontSize: 22,
  },
  regionItemText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  regionItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
