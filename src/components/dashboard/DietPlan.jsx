import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineMenuAlt3,
  HiOutlineGlobe,
  HiChevronDown,
  HiOutlineClipboardList,
  HiX,
  HiOutlineFire,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
  HiOutlineBookOpen
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';
import Sidebar from './Sidebar';

export default function DietPlan() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [loadingRegion, setLoadingRegion] = useState(false);
  const [recommendations, setRecommendations] = useState({});
  const [userTargets, setUserTargets] = useState(null);
  const [regionAvailable, setRegionAvailable] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const fetchRecommendations = async () => {
    setLoadingMeals(true);
    try {
      const data = await authApi.getRecommendations();
      setRecommendations(data.recommendations || {});
      setUserTargets(data.user_targets || null);
      setRegionAvailable(data.region_available !== false);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setRecommendations({});
    } finally {
      setLoadingMeals(false);
    }
  };

  const fetchRecipe = async (mealName) => {
    setLoadingRecipe(true);
    setRecipe(null);
    try {
      const data = await authApi.getRecipe(mealName);
      setRecipe(data.recipe);
    } catch (err) {
      console.error('Failed to fetch recipe:', err);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const openRecipe = (meal) => {
    setSelectedMeal(meal);
    fetchRecipe(meal.name);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user?.profile?.region, user?.profile?.dietary_goal, user?.profile?.dietary_type]);

  const handleRegionChange = async (region) => {
    setLoadingRegion(true);
    try {
      const data = await authApi.updateRegion(region);
      updateUser(data.user);
    } catch (err) {
      console.error('Failed to update region:', err);
    } finally {
      setLoadingRegion(false);
      setIsRegionOpen(false);
    }
  };

  const REGIONS = [
    { id: 'Punjab', label: 'Punjab', icon: '🌾' },
    { id: 'J&K', label: 'Jammu & Kashmir', icon: '🏔️' },
    { id: 'Himachal', label: 'Himachal Pradesh', icon: '🌲' },
    { id: 'Tamil Nadu', label: 'Tamil Nadu', icon: '🛕' },
    { id: 'Maharashtra', label: 'Maharashtra', icon: '🦁' },
    { id: 'Delhi', label: 'Delhi', icon: '🏛️' },
    { id: 'International', label: 'International', icon: '🌍' },
  ];

  const mealSlots = [
    { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
    { id: 'lunch', label: 'Lunch', icon: '🍲' },
    { id: 'snacks', label: 'Snacks', icon: '🍎' },
    { id: 'dinner', label: 'Dinner', icon: '🥘' }
  ];

  const currentRegion = REGIONS.find(r => r.id === (user?.profile?.region || 'Punjab')) || REGIONS[0];

  return (
    <div className="dashboard-scene">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            NutriAI
          </div>

          <div className="nav-actions">
            <div className="region-selector-wrapper" onClick={e => e.stopPropagation()}>
              <motion.button
                className="region-btn"
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsRegionOpen(!isRegionOpen)}
              >
                <HiOutlineGlobe size={18} />
                <span>{currentRegion.label}</span>
                <HiChevronDown className={`chevron ${isRegionOpen ? 'open' : ''}`} />
              </motion.button>
              <AnimatePresence>
                {isRegionOpen && (
                  <motion.div className="region-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    {REGIONS.map(reg => (
                      <button key={reg.id} className="dropdown-item" onClick={() => handleRegionChange(reg.id)}>
                        {reg.icon} {reg.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="menu-trigger" onClick={() => setIsSidebarOpen(true)}>
              <HiOutlineMenuAlt3 size={24} />
            </button>
          </div>
        </div>
      </nav>

      <main className="dashboard-main" style={{ paddingBottom: '100px' }}>
        <header className="welcome-header">
          <h1 className="greeting">Nutritional Blueprint</h1>
          <p className="welcome-sub">Optimized regional meal protocols mapped to your biometrics.</p>
        </header>

        {/* Goal Dashboard - Backend Aligned */}
        {userTargets && (
          <section className="goal-dashboard animate-fade-in">
            <div className="goal-header-main">
              <h3>Daily Objective</h3>
              <div className="status-badge" style={{ fontSize: '12px', color: 'var(--accent-cyan)', background: 'rgba(45, 212, 191, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                AI Active
              </div>
            </div>
            
            <div className="macro-stat">
              <span className="macro-stat-label">Energy Target</span>
              <div className="macro-stat-value">
                {userTargets.daily_calories} <span className="unit">kcal</span>
              </div>
            </div>

            <div className="macro-stat">
              <span className="macro-stat-label">Protein</span>
              <div className="macro-stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {userTargets.macros.protein} <span className="unit">g</span>
              </div>
            </div>

            <div className="macro-stat">
              <span className="macro-stat-label">Carbs</span>
              <div className="macro-stat-value" style={{ color: 'var(--accent-amber)' }}>
                {userTargets.macros.carbs} <span className="unit">g</span>
              </div>
            </div>

            <div className="macro-stat">
              <span className="macro-stat-label">Fats</span>
              <div className="macro-stat-value" style={{ color: 'var(--accent-purple)' }}>
                {userTargets.macros.fat} <span className="unit">g</span>
              </div>
            </div>
          </section>
        )}

        <section className="diet-section" style={{ marginTop: 0 }}>
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <h2 className="section-title" style={{ fontSize: '20px', fontWeight: 700 }}><HiOutlineClipboardList /> Protocol Recommendations</h2>
            <button className="view-all" onClick={fetchRecommendations} disabled={loadingMeals}>
              {loadingMeals ? 'Syncing...' : 'Regenerate'}
            </button>
          </div>

          <div className="recommendations-container">
            {loadingMeals ? (
              <div className="meals-grid-professional">
                {[1,2,3,4].map(n => <div key={n} className="shimmer-card" style={{ height: '400px' }} />)}
              </div>
            ) : regionAvailable ? (
              <div className="meals-grid-professional">
                {mealSlots.map((slot) => {
                  const meal = recommendations[slot.id];
                  if (!meal) return null;
                  
                  // Calculate macro percentages for meters
                  const totalMacros = meal.macros.protein + meal.macros.carbs + meal.macros.fat;
                  const pPerc = (meal.macros.protein / totalMacros) * 100;
                  const cPerc = (meal.macros.carbs / totalMacros) * 100;
                  const fPerc = (meal.macros.fat / totalMacros) * 100;

                  return (
                    <motion.div 
                      key={slot.id} 
                      className="meal-card-professional" 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * mealSlots.indexOf(slot) }}
                    >
                      <div className="meal-slot-label">{slot.label} Protocol</div>
                      <div className="meal-header-group">
                        <h3 className="meal-title-prof">{meal.name}</h3>
                        {meal.core_item && (
                          <div className="core-product-tag">
                            <span className="dot"></span> {meal.core_item} Base
                          </div>
                        )}
                      </div>
                      
                      {/* Macro Meters */}
                      <div className="macro-meter-group">
                        <div className="macro-meter-item">
                          <div className="macro-meter-header">
                            <span>Protein</span>
                            <span>{meal.macros.protein}g</span>
                          </div>
                          <div className="macro-progress-bg">
                            <motion.div className="macro-progress-fill" style={{ width: `${pPerc}%`, background: 'var(--accent-cyan)' }} initial={{ width: 0 }} animate={{ width: `${pPerc}%` }} />
                          </div>
                        </div>
                        <div className="macro-meter-item">
                          <div className="macro-meter-header">
                            <span>Carbohydrates</span>
                            <span>{meal.macros.carbs}g</span>
                          </div>
                          <div className="macro-progress-bg">
                            <motion.div className="macro-progress-fill" style={{ width: `${cPerc}%`, background: 'var(--accent-amber)' }} initial={{ width: 0 }} animate={{ width: `${cPerc}%` }} />
                          </div>
                        </div>
                        <div className="macro-meter-item">
                          <div className="macro-meter-header">
                            <span>Lipids / Fats</span>
                            <span>{meal.macros.fat}g</span>
                          </div>
                          <div className="macro-progress-bg">
                            <motion.div className="macro-progress-fill" style={{ width: `${fPerc}%`, background: 'var(--accent-purple)' }} initial={{ width: 0 }} animate={{ width: `${fPerc}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="ai-reasoning-box">
                        <div className="ai-reasoning-text">
                          <HiOutlineSparkles style={{ marginRight: '6px', color: 'var(--accent-cyan)' }} />
                          {meal.agent_hint}
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Match Precision: <strong style={{ color: 'var(--accent-cyan)' }}>{meal.match_score ? `${Math.round((1 - meal.match_score) * 100)}%` : 'Optimal'}</strong></span>
                        {meal.quantity_grams && <span>Serv. Size: <strong>{meal.quantity_grams}g</strong></span>}
                      </div>

                      <button className="recipe-link-btn" onClick={() => openRecipe(meal)}>
                        <HiOutlineBookOpen size={18} />
                        View Preparation Intel
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="region-unsupported-card">
                <div className="unsupported-content text-center">
                  <div className="unsupported-icon">🚀</div>
                  <h3 className="mb-2">Expanding Regional Dataset</h3>
                  <p className="text-secondary">Our experts are currently mapping standard protocols for {currentRegion.label}.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Recipe Modal - Premium 3D Refresh */}
      <AnimatePresence>
        {selectedMeal && (
          <div className="modal-overlay" onClick={() => setSelectedMeal(null)}>
            <motion.div 
              className="recipe-modal" 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {loadingRecipe ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                  <div className="btn-spinner" style={{ margin: '0 auto 24px', width: '40px', height: '40px', borderTopColor: 'var(--accent-cyan)' }} />
                  <p style={{ color: 'var(--text-secondary)', letterSpacing: '1px' }}>AI IS SYNTHESIZING RECIPE DATA...</p>
                </div>
              ) : recipe ? (
                <>
                  <div className="recipe-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span className="premium-label" style={{ background: 'var(--accent-cyan)', color: '#0a0e1a', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>PRO RECIPE</span>
                    </div>
                    <h2>{recipe.name}</h2>
                    <div className="recipe-meta" style={{ marginTop: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineFire /> {recipe.calories} Energy Units</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineLightningBolt /> {recipe.prep_time} Prep</span>
                    </div>
                    <button className="chatbot-close" style={{ position: 'absolute', top: '32px', right: '32px' }} onClick={() => setSelectedMeal(null)}>
                      <HiX size={24} />
                    </button>
                  </div>
                  <div className="recipe-content">
                    <div className="recipe-section">
                      <h4><HiOutlineClipboardList /> Strategic Ingredients</h4>
                      <div className="ingredient-list">
                        {recipe.ingredients.map((ing, i) => (
                          <div key={i} className="ingredient-item">{ing}</div>
                        ))}
                      </div>
                    </div>
                    <div className="recipe-section" style={{ marginTop: '32px' }}>
                      <h4><HiOutlineMenuAlt3 /> Execution Steps</h4>
                      <div className="instruction-steps">
                        {recipe.instructions.map((step, i) => (
                          <div key={i} className="instruction-step">
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginRight: '12px' }}>{String(i + 1).padStart(2, '0')}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="recipe-footer">
                    <button className="btn btn-secondary" style={{ padding: '10px 24px', fontSize: '13px' }} onClick={() => setSelectedMeal(null)}>Close Intel</button>
                  </div>
                </>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--error)' }}>AI Transmission Failed</h3>
                  <p style={{ marginTop: '12px' }}>We couldn't retrieve the preparation intelligence for this dish.</p>
                  <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => fetchRecipe(selectedMeal.name)}>Retry Sync</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
