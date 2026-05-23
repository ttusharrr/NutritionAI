import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { setupProfile } from '../api/authApi';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    activity_level: '',
    dietary_goal: '',
    dietary_type: '',
    region: '',
    diseases: [],
    allergies: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setProfileData({
          name: userData.name || '',
          age: userData.profile?.age?.toString() || '',
          gender: userData.profile?.gender || '',
          weight: userData.profile?.weight?.toString() || '',
          height: userData.profile?.height?.toString() || '',
          activity_level: userData.profile?.activity_level || '',
          dietary_goal: userData.profile?.dietary_goal || '',
          dietary_type: userData.profile?.dietary_type || '',
          region: userData.profile?.region || '',
          diseases: userData.profile?.diseases || [],
          allergies: userData.profile?.allergies || '',
        });
      }
    };
    loadUser();
  }, []);

  const handleUpdateProfile = async () => {
    // Basic validation
    if (!profileData.name || !profileData.age || !profileData.weight || !profileData.height) {
      Alert.alert('Error', 'Please fill in all basic information.');
      return;
    }

    setLoading(true);
    try {
      const response = await setupProfile({
        ...profileData,
        age: parseInt(profileData.age),
        weight: parseInt(profileData.weight),
        height: parseInt(profileData.height),
      });
      
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to update profile.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisease = (disease) => {
    const newDiseases = profileData.diseases.includes(disease)
      ? profileData.diseases.filter(d => d !== disease)
      : [...profileData.diseases, disease];
    setProfileData({ ...profileData, diseases: newDiseases });
  };

  const renderInfoItem = (label, value, icon) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            {isEditing ? (
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {isEditing ? (
              <View style={styles.form}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.card}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      value={profileData.name}
                      onChangeText={(t) => setProfileData({ ...profileData, name: t })}
                      placeholder="Your name"
                      placeholderTextColor={COLORS.textTertiary}
                    />
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Age</Text>
                      <TextInput
                        style={styles.input}
                        value={profileData.age}
                        onChangeText={(t) => setProfileData({ ...profileData, age: t })}
                        placeholder="Age"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.textTertiary}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <View style={styles.genderRow}>
                        {['male', 'female'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genderBtn, profileData.gender === g && styles.genderBtnActive]}
                            onPress={() => setProfileData({ ...profileData, gender: g })}
                          >
                            <Text style={[styles.genderBtnText, profileData.gender === g && styles.genderBtnTextActive]}>
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.input}
                        value={profileData.weight}
                        onChangeText={(t) => setProfileData({ ...profileData, weight: t })}
                        placeholder="kg"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.textTertiary}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Height (cm)</Text>
                      <TextInput
                        style={styles.input}
                        value={profileData.height}
                        onChangeText={(t) => setProfileData({ ...profileData, height: t })}
                        placeholder="cm"
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.textTertiary}
                      />
                    </View>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Health & Diet</Text>
                <View style={styles.card}>
                  <Text style={styles.inputLabel}>Medical Conditions</Text>
                  <View style={styles.tagGrid}>
                    {[
                      { id: 'BP', label: 'Blood Pressure' },
                      { id: 'Diabetes', label: 'Diabetes' },
                    ].map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={[styles.tag, profileData.diseases.includes(d.id) && styles.tagActive]}
                        onPress={() => toggleDisease(d.id)}
                      >
                        <Text style={[styles.tagText, profileData.diseases.includes(d.id) && styles.tagTextActive]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Food Allergies</Text>
                  <TextInput
                    style={styles.input}
                    value={profileData.allergies}
                    onChangeText={(t) => setProfileData({ ...profileData, allergies: t })}
                    placeholder="e.g. Peanuts, Milk"
                    placeholderTextColor={COLORS.textTertiary}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Activity Level</Text>
                  <View style={styles.pickerWrap}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {['sedentary', 'light', 'moderate', 'very_active'].map((a) => (
                        <TouchableOpacity
                          key={a}
                          style={[styles.pickerItem, profileData.activity_level === a && styles.pickerItemActive]}
                          onPress={() => setProfileData({ ...profileData, activity_level: a })}
                        >
                          <Text style={[styles.pickerText, profileData.activity_level === a && styles.pickerTextActive]}>
                            {a.replace('_', ' ').charAt(0).toUpperCase() + a.replace('_', ' ').slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.display}>
                {/* User Hero */}
                <View style={styles.heroCard}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                  </View>
                  <Text style={styles.userName}>{user?.name}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                {/* Personal Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{user?.profile?.age || '--'}</Text>
                    <Text style={styles.statLab}>Years</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{user?.profile?.weight || '--'}</Text>
                    <Text style={styles.statLab}>kg</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{user?.profile?.height || '--'}</Text>
                    <Text style={styles.statLab}>cm</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Physical Blueprint</Text>
                <View style={styles.card}>
                  {renderInfoItem('Gender', user?.profile?.gender, 'transgender-outline')}
                  <View style={styles.divider} />
                  {renderInfoItem('Region', user?.profile?.region, 'globe-outline')}
                  <View style={styles.divider} />
                  {renderInfoItem('Activity', user?.profile?.activity_level?.replace('_', ' '), 'fitness-outline')}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Health Intelligence</Text>
                <View style={styles.card}>
                  {renderInfoItem(
                    'Conditions', 
                    user?.profile?.diseases?.length > 0 ? user.profile.diseases.join(', ') : 'None', 
                    'medkit-outline'
                  )}
                  <View style={styles.divider} />
                  {renderInfoItem('Allergies', user?.profile?.allergies || 'None', 'alert-circle-outline')}
                  <View style={styles.divider} />
                  {renderInfoItem('Goal', user?.profile?.dietary_goal?.replace('_', ' '), 'trending-up-outline')}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  editBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  /* Display Mode */
  heroCard: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  userEmail: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statVal: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statLab: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  /* Form Mode */
  form: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  genderBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  genderBtnTextActive: {
    color: COLORS.primary,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  tagActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tagTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickerWrap: {
    marginTop: 4,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginRight: 10,
  },
  pickerItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  pickerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pickerTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
  },
  cancelBtnText: {
    color: COLORS.error,
    fontWeight: '700',
  },
});
