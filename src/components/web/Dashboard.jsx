/**
 * Dashboard — Advanced industry-ready nutrition oversight.
 * Displays calories, macros, and region selection.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineLogout, 
  HiChevronDown, 
  HiOutlineFire, 
  HiOutlineLightningBolt,
  HiOutlineHeart,
  HiOutlineCube,
  HiOutlineGlobe,
  HiOutlineUserCircle,
  HiOutlineClipboardList,
  HiOutlineMenuAlt3
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';
import Sidebar from './Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [loadingRegion, setLoadingRegion] = useState(false);
  const [recommendations, setRecommendations] = useState({});
  const [regionAvailable, setRegionAvailable] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);

  // Close region dropdown on click outside
  useEffect(() => {
    const handleClick = () => setIsRegionOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Fetch recommendations
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
  }, [user?.profile?.region, user?.profile?.dietary_goal]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRegionChange = async (region) => {
    if (region === currentRegion.id) return;
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
    { id: 'Gujarat', label: 'Gujarat', icon: '🌊' },
    { id: 'West Bengal', label: 'West Bengal', icon: '🐯' },
    { id: 'Karnataka', label: 'Karnataka', icon: '🐘' },
    { id: 'Kerala', label: 'Kerala', icon: '🌴' },
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

  const nutrition = user?.daily_nutrition || {
    daily_calories: 0,
    macros: { protein: 0, carbs: 0, fat: 0 },
    bmi_data: { value: 0, status: 'N/A' }
  };

  const getBMIColor = (status) => {
    switch (status) {
      case 'Underweight': return 'var(--accent-amber)';
      case 'Normal': return 'var(--success)';
      case 'Overweight': return 'var(--accent-pink)';
      case 'Obese': return 'var(--error)';
      default: return 'var(--text-tertiary)';
    }
  };

  return (
    <div className="dashboard-scene">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <motion.div 
            className="brand-logo" 
            style={{ fontSize: '24px' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            NutriAI
          </motion.div>

          <div className="nav-actions">
            {/* Region Selector */}
            <div className="region-selector-wrapper" onClick={e => e.stopPropagation()}>
              <motion.button
                className="region-btn"
                onClick={() => setIsRegionOpen(!isRegionOpen)}
                whileTap={{ scale: 0.97 }}
              >
                <HiOutlineGlobe size={18} />
                <span>{currentRegion.label}</span>
                <HiChevronDown className={`chevron ${isRegionOpen ? 'open' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {isRegionOpen && (
                  <motion.div 
                    className="region-dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">Select Regional Cuisine</div>
                    {REGIONS.map(reg => (
                      <button 
                        key={reg.id} 
                        className={`dropdown-item ${currentRegion.id === reg.id ? 'active' : ''}`}
                        onClick={() => handleRegionChange(reg.id)}
                        disabled={loadingRegion}
                      >
                        <span className="emoji">{reg.icon}</span>
                        {reg.label}
                        {currentRegion.id === reg.id && <div className="active-dot" />}
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
        {/* Welcome Section */}
        <header className="welcome-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="greeting">Welcome, {user?.name?.split(' ')[0] || 'Explorer'}!</h1>
            <p className="welcome-sub">Here is your nutritional blueprint for today.</p>
          </motion.div>
        </header>

        {/* Nutritional Grid */}
        <div className="nutrition-grid">
          {/* Main Mission Control Card */}
          <motion.div 
            className="nutrition-card mission-control-hero"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mission-content">
              <div className="energy-meter-box">
                <svg viewBox="0 0 100 100" className="energy-ring">
                  <circle className="ring-bg" cx="50" cy="50" r="45" />
                  <motion.circle 
                    className="ring-fill" 
                    cx="50" cy="50" r="45" 
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ strokeDasharray: "180 283" }} // 65% progress mock
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                </svg>
                <div className="energy-stats">
                  <div className="energy-value">{nutrition.daily_calories.toLocaleString()}</div>
                  <div className="energy-label">TARGET KCAL</div>
                </div>
              </div>

              <div className="mission-details">
                <div className="protocol-status">
                  <span className="pulse-dot"></span>
                  PROTOCOL ACTIVE
                </div>
                <h3>System Integrity: 94%</h3>
                <p>Your biological markers are optimized for the {user?.profile?.dietary_goal?.replace('_', ' ') || 'Maintain'} protocol.</p>
                <button className="btn-protocol-sync" onClick={fetchRecommendations}>
                  <HiOutlineLightningBolt /> RE-SYNC PROTOCOL
                </button>
              </div>
            </div>
          </motion.div>

          {/* Macro Breakdown */}
          <div className="macro-cards">
            {[
              { label: 'Protein', value: nutrition.macros.protein, unit: 'g', icon: HiOutlineLightningBolt, color: 'var(--accent-cyan)' },
              { label: 'Carbs', value: nutrition.macros.carbs, unit: 'g', icon: HiOutlineCube, color: 'var(--accent-purple)' },
              { label: 'Fats', value: nutrition.macros.fat, unit: 'g', icon: HiOutlineHeart, color: 'var(--accent-pink)' },
            ].map((macro, idx) => (
              <motion.div 
                key={macro.label}
                className="macro-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="macro-icon-wrapper" style={{ color: macro.color, background: `${macro.color}15` }}>
                  <macro.icon size={20} />
                </div>
                <div>
                  <div className="macro-label">{macro.label}</div>
                  <div className="macro-value-row">
                    <span className="macro-v">{macro.value}</span>
                    <span className="macro-u">{macro.unit}</span>
                  </div>
                </div>
                {/* Visual line */}
                <div className="macro-progress-bg">
                  <motion.div 
                    className="macro-progress-fill" 
                    style={{ background: macro.color }}
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Featured Protocol & Checklist */}
        <div className="mission-secondary-grid">
          {/* Next Meal Protocol */}
          <motion.div 
            className="featured-meal-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-header">
              <HiOutlineClipboardList className="header-icon" />
              <span>Next Protocol Item</span>
            </div>
            {loadingMeals ? (
              <div className="meal-skeleton"></div>
            ) : recommendations.breakfast ? (
              <div className="featured-meal-content">
                <div className="meal-tag">{recommendations.breakfast.category}</div>
                <h4>{recommendations.breakfast.name}</h4>
                <div className="meal-stats">
                  <span>{recommendations.breakfast.macros.calories} kcal</span>
                  <span className="dot"></span>
                  <span>{recommendations.breakfast.macros.protein}g Protein</span>
                </div>
                <button className="btn-view-recipe" onClick={() => navigate('/diet-plan')}>
                  VIEW FULL PROTOCOL <HiArrowRight />
                </button>
              </div>
            ) : (
              <div className="no-meal-state">
                <p>Initializing daily meal sequences...</p>
              </div>
            )}
          </motion.div>

          {/* Daily Protocol Checklist */}
          <motion.div 
            className="protocol-checklist-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card-header">
              <span>Health Protocol</span>
              <span className="completion-count">2/4 Done</span>
            </div>
            <div className="checklist-items">
              {[
                { label: 'Hydration Cycle (1.5L)', done: true },
                { label: 'Log Breakfast Protocol', done: true },
                { label: 'Post-Meal Circulation', done: false },
                { label: 'Nightly Recovery Logic', done: false },
              ].map((item, i) => (
                <div key={i} className={`checklist-item ${item.done ? 'done' : ''}`}>
                  <div className="check-box">{item.done && <HiCheck />}</div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Health Insights (BMI) Row */}
        <motion.div 
          className="health-insights-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bmi-strip">
            <div className="bmi-info">
              <span className="bmi-label">Body Mass Index (BMI)</span>
              <div className="bmi-val-group">
                <span className="bmi-value">{nutrition.bmi_data?.value || '0.0'}</span>
                <span className="bmi-tag" style={{ 
                  background: `${getBMIColor(nutrition.bmi_data?.status)}20`,
                  color: getBMIColor(nutrition.bmi_data?.status),
                  borderColor: `${getBMIColor(nutrition.bmi_data?.status)}40`
                }}>
                  {nutrition.bmi_data?.status || 'Calculating'}
                </span>
              </div>
            </div>
            
            <div className="bmi-visual-meter">
              <div className="meter-segments">
                <div className="segment under" />
                <div className="segment normal" />
                <div className="segment over" />
                <div className="segment obese" />
              </div>
              <motion.div 
                className="meter-pointer" 
                initial={{ left: '0%' }}
                animate={{ left: `${Math.min(Math.max((nutrition.bmi_data?.value - 15) / 25 * 100, 2), 98)}%` }}
                transition={{ duration: 1.5, type: 'spring' }}
              />
              <div className="meter-labels">
                <span style={{ left: '0%' }}>15</span>
                <span style={{ left: '16%' }}>18.5</span>
                <span style={{ left: '40%' }}>25</span>
                <span style={{ left: '60%' }}>30</span>
                <span style={{ left: '100%' }}>40+</span>
              </div>
            </div>

          </div>
        </motion.div>
      </main>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Background Decor */}
      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
