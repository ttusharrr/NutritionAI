import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineMenuAlt3,
  HiOutlineGlobe,
  HiChevronDown,
  HiOutlineClipboardList
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
  const [regionAvailable, setRegionAvailable] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const fetchRecommendations = async () => {
    setLoadingMeals(true);
    try {
      const data = await authApi.getRecommendations();
      setRecommendations(data.recommendations || {});
      setRegionAvailable(data.region_available !== false);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setRecommendations({});
    } finally {
      setLoadingMeals(false);
    }
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

      <main className="dashboard-main">
        <header className="welcome-header">
          <h1 className="greeting">Daily Nutritional Plan</h1>
          <p className="welcome-sub">Precision-mapped regional meals for your {user?.profile?.dietary_type} preference.</p>
        </header>

        <section className="diet-section" style={{ marginTop: 0 }}>
          <div className="section-header">
            <h2 className="section-title"><HiOutlineClipboardList /> Your Recommendations</h2>
            <button className="view-all" onClick={fetchRecommendations} disabled={loadingMeals}>
              {loadingMeals ? 'Refreshing...' : 'Regenerate'}
            </button>
          </div>

          <div className="recommendations-container">
            {loadingMeals ? (
              <div className="meals-loading">
                {[1,2,3,4].map(n => <div key={n} className="shimmer-card" />)}
              </div>
            ) : regionAvailable ? (
              <div className="meals-grid-daily">
                {mealSlots.map((slot) => {
                  const meal = recommendations[slot.id];
                  if (!meal) return null;
                  return (
                    <div key={slot.id} className="meal-card-professional">
                      <div className="slot-header">
                        <span className="slot-icon">{slot.icon}</span>
                        <span className="slot-name">{slot.label}</span>
                        <span className="slot-target">{meal.target_calories} kcal</span>
                      </div>
                      <h3 className="meal-name-prof">{meal.name}</h3>
                      <div className="meal-macros-mini">
                        <div className="mini-macro"><span>P</span> {meal.macros.protein}g</div>
                        <div className="mini-macro"><span>C</span> {meal.macros.carbs}g</div>
                        <div className="mini-macro"><span>F</span> {meal.macros.fat}g</div>
                      </div>
                      <p className="agent-hint">✨ {meal.agent_hint}</p>
                      <div className="meal-footer-prof">
                        <div className="cal-breakdown">
                          <span className="actual-cal">{meal.macros.calories}</span>
                          <span className="slash">/</span>
                          <span className="target-cal">{meal.target_calories}</span>
                          <span className="unit">kcal</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="region-unsupported-card">
                <div className="unsupported-content">
                  <div className="unsupported-icon">🚀</div>
                  <h3>Coming Soon to {currentRegion.label}!</h3>
                  <p>Our experts are mapping {currentRegion.label}'s ingredients.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
