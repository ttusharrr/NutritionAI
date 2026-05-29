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
  HiOutlineMenuAlt3,
  HiOutlineBeaker
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

  // Water Intake State
  const [waterData, setWaterData] = useState({ total_ml: 0, goal_ml: 2500, progress: 0, logs: [] });
  const [waterLogging, setWaterLogging] = useState(false);

  const fetchWaterData = async () => {
    try {
      const res = await authApi.getTodayWater();
      if (res) {
        setWaterData(res);
      }
    } catch (err) {
      console.error('Failed to load water:', err);
    }
  };

  useEffect(() => {
    fetchWaterData();
  }, []);

  const handleLogWater = async (amount) => {
    setWaterLogging(true);
    try {
      await authApi.logWater(amount);
      await fetchWaterData();
    } catch (err) {
      console.error('Failed to log water:', err);
    } finally {
      setWaterLogging(false);
    }
  };

  // Close region dropdown on click outside
  useEffect(() => {
    const handleClick = () => setIsRegionOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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
          {/* Main Calorie Card */}
          <motion.div 
            className="nutrition-card calorie-hero"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-flare" />
            <div className="card-label">Daily Target</div>
            <div className="calorie-value">
              <HiOutlineFire className="fire-icon" />
              {nutrition.daily_calories.toLocaleString()}
            </div>
            <div className="card-unit">kcal / day</div>
            
            <div className="goal-tag">
              {user?.profile?.dietary_goal?.replace('_', ' ') || 'Maintain'}
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

        {/* Health Insights (BMI) & Water Intake Row */}
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

          <div className="water-card-web">
            <div className="water-header-row">
              <div className="water-info-col">
                <span className="water-title">
                  💧 Water Intake
                </span>
                <div className="water-main-value">
                  {waterData.total_ml || 0} <span className="water-unit">/ {waterData.goal_ml || 2500} ml</span>
                </div>
                <div className="water-status-text">
                  {(waterData.progress || 0) >= 100 ? '🎉 Goal Achieved!' : `${Math.max(0, (waterData.goal_ml || 2500) - (waterData.total_ml || 0))} ml left`}
                </div>
              </div>
              <div className="water-progress-circle-outer">
                <div className="water-progress-circle-inner" style={{ height: `${Math.min(100, waterData.progress || 0)}%` }} />
                <span className="water-progress-percent">{Math.round(waterData.progress || 0)}%</span>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="water-quick-add-row">
              {[150, 250, 500].map((amt) => (
                <button
                  key={amt}
                  className="water-quick-btn"
                  disabled={waterLogging}
                  onClick={() => handleLogWater(amt)}
                >
                  <HiOutlineBeaker size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>+{amt}ml</span>
                </button>
              ))}
            </div>

            {/* Logs List */}
            {waterData.logs && waterData.logs.length > 0 && (
              <div className="water-logs-section">
                <div className="water-logs-title">Recent Logs</div>
                {waterData.logs.slice(0, 2).map((log, idx) => {
                  const time = new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={idx} className="water-log-item">
                      <div className="water-log-left">
                        <HiOutlineBeaker size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <span className="water-log-text">{log.amount_ml} ml</span>
                      </div>
                      <span className="water-log-time">{time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Regional Focus Section */}
        <motion.section 
          className="regional-focus-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '30px' }}
        >
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineGlobe className="text-cyan" /> 
              Regional Cuisine Focus
            </h2>
            <p className="welcome-sub" style={{ marginBottom: '20px' }}>
              Explore nutritional protocols based on authentic Indian regions.
            </p>
          </div>

          <div className="region-cards-scroll">
            {REGIONS.map((reg, idx) => (
              <motion.div
                key={reg.id}
                className={`region-focus-card ${currentRegion.id === reg.id ? 'active' : ''}`}
                onClick={() => handleRegionChange(reg.id)}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
              >
                <div className="region-icon">{reg.icon}</div>
                <div className="region-info">
                  <div className="region-name">{reg.label}</div>
                  <div className="region-status">
                    {currentRegion.id === reg.id ? 'Current Focus' : 'Explore Cuisine'}
                  </div>
                </div>
                {currentRegion.id === reg.id && <div className="active-glow" />}
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/diet-plan')}
              style={{ padding: '12px 32px' }}
            >
              View Full {currentRegion.label} Diet Plan
            </button>
          </div>
        </motion.section>
      </main>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Background Decor */}
      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
