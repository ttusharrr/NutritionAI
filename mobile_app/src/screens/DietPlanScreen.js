import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { getRecommendations, getRecipe } from '../api/authApi';

export default function DietPlanScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const loadData = async () => {
    try {
      const response = await getRecommendations();
      setData(response);
    } catch (err) {
      console.error('Error loading diet plan:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRegenerate = () => {
    setLoading(true);
    loadData();
  };

  const openRecipe = async (meal) => {
    setSelectedMeal(meal);
    setLoadingRecipe(true);
    setRecipe(null);
    try {
      const data = await getRecipe(meal.name);
      setRecipe(data.recipe);
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const mealSlots = [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🍲' },
    { id: 'snacks', label: 'Snacks', icon: '🍎' },
    { id: 'dinner', label: 'Dinner', icon: '🥘' }
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Generating meal protocol...</Text>
      </View>
    );
  }

  const recommendations = data?.recommendations || {};
  const userTargets = data?.user_targets || null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Nebula Background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.nebula1} />
        <View style={styles.nebula2} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - Parity with Web/Dashboard */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandText}>Nutri<Text style={{ color: COLORS.primary }}>AI</Text></Text>
            <Text style={styles.greetingTitle}>Meal Protocol</Text>
          </View>
          <TouchableOpacity style={styles.regenBtn} onPress={handleRegenerate}>
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.regenText}>Regenerate</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Objective Summary */}
        {userTargets && (
          <View style={styles.objectiveCard}>
            <View style={styles.objectiveHeader}>
              <Text style={styles.objectiveTitle}>Daily Objective</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>Agentic Reasoning Active</Text>
              </View>
            </View>
          <View style={styles.objectiveGrid}>
            <View style={styles.objectiveStat}>
              <Text style={styles.objectiveValue}>{userTargets.daily_calories}</Text>
              <Text style={styles.objectiveUnit}>kcal</Text>
            </View>
            <View style={styles.objectiveDivider} />
            <View style={styles.objectiveStat}>
              <Text style={[styles.objectiveValue, { color: COLORS.primary }]}>{userTargets.macros.protein}g</Text>
              <Text style={styles.objectiveUnit}>Protein</Text>
            </View>
            <View style={styles.objectiveDivider} />
            <View style={styles.objectiveStat}>
              <Text style={[styles.objectiveValue, { color: '#fbbf24' }]}>{userTargets.macros.carbs}g</Text>
              <Text style={styles.objectiveUnit}>Carbs</Text>
            </View>
            <View style={styles.objectiveDivider} />
            <View style={styles.objectiveStat}>
              <Text style={[styles.objectiveValue, { color: COLORS.secondary }]}>{userTargets.macros.fat}g</Text>
              <Text style={styles.objectiveUnit}>Fats</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={mealSlots}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const meal = recommendations[item.id];
          if (!meal) return null;

          const totalMacros = (meal.macros.protein || 0) + (meal.macros.carbs || 0) + (meal.macros.fat || 0);
          const pPerc = totalMacros ? (meal.macros.protein / totalMacros) * 100 : 0;
          const cPerc = totalMacros ? (meal.macros.carbs / totalMacros) * 100 : 0;
          const fPerc = totalMacros ? (meal.macros.fat / totalMacros) * 100 : 0;

          return (
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotLabel}>{item.label} Protocol</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  {meal.core_item && (
                    <View style={styles.coreTag}>
                      <View style={styles.coreDot} />
                      <Text style={styles.coreText}>{meal.core_item} Base</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.emoji}>{item.icon}</Text>
              </View>

              {/* Macro Progress Bars */}
              <View style={styles.macroMeters}>
                <MacroMeter label="Protein" value={meal.macros.protein} percent={pPerc} color={COLORS.primary} />
                <MacroMeter label="Carbs" value={meal.macros.carbs} percent={cPerc} color="#fbbf24" />
                <MacroMeter label="Fats" value={meal.macros.fat} percent={fPerc} color={COLORS.secondary} />
              </View>

              {/* AI Insight */}
              <View style={styles.insightBox}>
                <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                <Text style={styles.insightText}>{meal.agent_hint}</Text>
              </View>

              {/* Serving + Recipe */}
              <View style={styles.mealFooter}>
                {meal.quantity_grams && (
                  <Text style={styles.servingText}>Serving: <Text style={{ fontWeight: '700' }}>{meal.quantity_grams}g</Text></Text>
                )}
                <TouchableOpacity style={styles.recipeBtn} onPress={() => openRecipe(meal)}>
                  <Ionicons name="book-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.recipeBtnText}>View Recipe</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Recipe Modal */}
      <Modal
        visible={!!selectedMeal}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMeal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {loadingRecipe ? (
              <View style={styles.recipeLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.recipeLoadingText}>AI IS SYNTHESIZING RECIPE...</Text>
              </View>
            ) : recipe ? (
              <ScrollView style={styles.recipeScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.recipeHeader}>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO RECIPE</Text>
                  </View>
                  <Text style={styles.recipeTitle}>{recipe.name}</Text>
                  <View style={styles.recipeMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="flame-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.metaText}>{recipe.calories} cal</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.metaText}>{recipe.prep_time}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.recipeSectionTitle}>
                  <Ionicons name="list-outline" size={16} /> Strategic Ingredients
                </Text>
                {recipe.ingredients?.map((ing, i) => (
                  <View key={i} style={styles.ingredientItem}>
                    <View style={styles.ingredientDot} />
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}

                <Text style={[styles.recipeSectionTitle, { marginTop: 24 }]}>
                  <Ionicons name="footsteps-outline" size={16} /> Execution Steps
                </Text>
                {recipe.instructions?.map((step, i) => (
                  <View key={i} style={styles.stepItem}>
                    <Text style={styles.stepNumber}>{String(i + 1).padStart(2, '0')}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.closeRecipeBtn} onPress={() => setSelectedMeal(null)}>
                  <Text style={styles.closeRecipeBtnText}>Close Recipe</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.recipeError}>
                <Text style={styles.recipeErrorTitle}>AI Transmission Failed</Text>
                <Text style={styles.recipeErrorText}>Couldn't retrieve recipe data.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => openRecipe(selectedMeal)}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.modalCloseX} onPress={() => setSelectedMeal(null)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  </View>
);
}

function MacroMeter({ label, value, percent, color }) {
  return (
    <View style={styles.meterItem}>
      <View style={styles.meterHeader}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={[styles.meterValue, { color }]}>{value}g</Text>
      </View>
      <View style={styles.meterBg}>
        <View style={[styles.meterFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  greetingTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
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
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.2)',
  },
  regenText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  /* Objective Card */
  objectiveCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 20,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  objectiveTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  aiBadge: {
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  objectiveGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  objectiveStat: {
    flex: 1,
    alignItems: 'center',
  },
  objectiveValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  objectiveUnit: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  objectiveDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  /* List */
  listContent: {
    paddingBottom: 40,
  },
  /* Meal Card */
  mealCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  slotLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  mealName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    maxWidth: '90%',
  },
  emoji: {
    fontSize: 28,
  },
  coreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  coreDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  coreText: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  /* Macro Meters */
  macroMeters: {
    gap: 10,
    marginBottom: 16,
  },
  meterItem: {},
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  meterValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  meterBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  /* Insight */
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.1)',
  },
  insightText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },
  /* Meal Footer */
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingText: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  recipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recipeBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalCloseX: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 8,
  },
  /* Recipe */
  recipeLoading: {
    padding: 60,
    alignItems: 'center',
  },
  recipeLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 20,
  },
  recipeScroll: {
    padding: 24,
    paddingTop: 16,
  },
  recipeHeader: {
    marginBottom: 24,
  },
  proBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  proBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  recipeTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  recipeSectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  ingredientText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  stepNumber: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
    width: 24,
  },
  stepText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  closeRecipeBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  closeRecipeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  recipeError: {
    padding: 60,
    alignItems: 'center',
  },
  recipeErrorTitle: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '800',
  },
  recipeErrorText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
