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
  HiOutlineClipboardList
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [loadingRegion, setLoadingRegion] = useState(false);

  // Close region dropdown on click outside
  useEffect(() => {
    const handleClick = () => setIsRegionOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

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
    macros: { protein: 0, carbs: 0, fat: 0 }
  };

  return (
    <div className="dashboard-scene">
      {/* Premium Navigation */}
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

            <button className="nav-profile-btn" onClick={() => navigate('/profile-setup')}>
              <HiOutlineUserCircle size={22} />
            </button>

            <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
              <HiOutlineLogout size={22} />
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
            <h1 className="greeting">Good Morning, {user?.name?.split(' ')[0] || 'Explorer'}!</h1>
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
                    animate={{ width: '65%' }} // Fixed visual for dashboard "cleanliness"
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Diet Plan Section (Static/Dummy for now) */}
        <section className="diet-section">
          <div className="section-header">
            <h2 className="section-title">
              <HiOutlineClipboardList /> Today's Diet Plan
            </h2>
            <button className="view-all">Customize Plan</button>
          </div>

          <div className="diet-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🌱</div>
              <h3>Intelligent Plan Cooking...</h3>
              <p>Our AI is analyzing {currentRegion.label} market availability to build your perfect meal sequence.</p>
              <div className="placeholder-tags">
                <span className="tag">Low Glycemic</span>
                <span className="tag">High Volume</span>
                <span className="tag">{user?.profile?.gender === 'female' ? 'Women Optimized' : 'Men Optimized'}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Background Decor */}
      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}

