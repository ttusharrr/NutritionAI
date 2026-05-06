/**
 * ProfilePage — Comprehensive user profile view and edit.
 * Premium glassmorphism design.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlinePencilAlt,
  HiOutlineSave,
  HiOutlineX
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import authApi from '../../api/authApi';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    age: user?.profile?.age || '',
    gender: user?.profile?.gender || '',
    weight: user?.profile?.weight || '',
    height: user?.profile?.height || '',
    activity_level: user?.profile?.activity_level || '',
    dietary_goal: user?.profile?.dietary_goal || '',
    dietary_type: user?.profile?.dietary_type || '',
    region: user?.profile?.region || '',
    diseases: user?.profile?.diseases || [],
    allergies: user?.profile?.allergies || '',
  });

  // Sync profile data when user is loaded or updated
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        age: user.profile?.age || '',
        gender: user.profile?.gender || '',
        weight: user.profile?.weight || '',
        height: user.profile?.height || '',
        activity_level: user.profile?.activity_level || '',
        dietary_goal: user.profile?.dietary_goal || '',
        dietary_type: user.profile?.dietary_type || '',
        region: user.profile?.region || '',
        diseases: user.profile?.diseases || [],
        allergies: user.profile?.allergies || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await authApi.updateProfile(profileData);
      updateUser(data.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-scene">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <motion.div
            className="brand-logo"
            style={{ fontSize: '24px', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            NutriAI
          </motion.div>
          <button
            className="region-btn"
            onClick={() => navigate(-1)}
            style={{ gap: '8px' }}
          >
            <HiOutlineArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-main" style={{ maxWidth: '800px' }}>
        <motion.header
          className="welcome-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="greeting">My Profile</h1>
          <p className="welcome-sub">View and update your health data and preferences.</p>
        </motion.header>

        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              key="success"
              className="alert alert-success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              key="error"
              className="alert alert-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="settings-card-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiOutlineUser size={20} className="text-cyan" />
              <h2>Personal Information</h2>
            </div>
            {!isEditing && (
              <button 
                className="btn-primary" 
                onClick={() => setIsEditing(true)}
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
              >
                <HiOutlinePencilAlt size={16} /> Edit Profile
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form 
                key="edit-form"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onSubmit={handleUpdateProfile}
                className="settings-form"
              >
                <div className="settings-info-grid editing">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profileData.name} 
                      onChange={e => setProfileData({...profileData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={profileData.age} 
                      onChange={e => setProfileData({...profileData, age: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={profileData.weight} 
                      onChange={e => setProfileData({...profileData, weight: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={profileData.height} 
                      onChange={e => setProfileData({...profileData, height: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="divider" style={{ margin: '30px 0' }}><span>Health & Diet</span></div>

                <div className="form-group">
                  <label className="form-label">Medical Conditions</label>
                  <div className="segmented-group cols-2">
                    {[
                      { value: 'BP', label: 'Blood Pressure' },
                      { value: 'Diabetes', label: 'Diabetes' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`segmented-btn ${profileData.diseases.includes(opt.value) ? 'active' : ''}`}
                        onClick={() => {
                          const newDiseases = profileData.diseases.includes(opt.value)
                            ? profileData.diseases.filter(d => d !== opt.value)
                            : [...profileData.diseases, opt.value];
                          setProfileData({ ...profileData, diseases: newDiseases });
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Food Allergies</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Peanuts, Milk (Leave empty if none)"
                    value={profileData.allergies} 
                    onChange={e => setProfileData({...profileData, allergies: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Activity Level</label>
                  <select 
                    className="form-input form-input--no-icon"
                    value={profileData.activity_level}
                    onChange={e => setProfileData({...profileData, activity_level: e.target.value})}
                  >
                    <option value="sedentary">Sedentary (Little to no exercise)</option>
                    <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                    <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                    <option value="very_active">Very Active (6-7 days/week)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto', padding: '12px 30px' }}>
                    {loading ? <div className="btn-spinner" /> : <><HiOutlineSave size={18} /> Save Changes</>}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsEditing(false)}
                    style={{ width: 'auto', padding: '12px 30px' }}
                  >
                    <HiOutlineX size={18} /> Cancel
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="view-info"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="profile-info-display"
              >
                <div className="settings-info-grid">
                  <div className="settings-info-item">
                    <span className="settings-info-label">Full Name</span>
                    <span className="settings-info-value">{user?.name}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Age</span>
                    <span className="settings-info-value">{user?.profile?.age} years</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Gender</span>
                    <span className="settings-info-value" style={{ textTransform: 'capitalize' }}>{user?.profile?.gender}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Weight</span>
                    <span className="settings-info-value">{user?.profile?.weight} kg</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Height</span>
                    <span className="settings-info-value">{user?.profile?.height} cm</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Region</span>
                    <span className="settings-info-value">{user?.profile?.region || 'Global'}</span>
                  </div>
                </div>

                <div className="divider" style={{ margin: '30px 0' }}><span>Health Insights</span></div>

                <div className="settings-info-grid">
                  <div className="settings-info-item">
                    <span className="settings-info-label">Diseases</span>
                    <span className="settings-info-value">
                      {user?.profile?.diseases?.length > 0 ? user.profile.diseases.join(', ') : 'None Reported'}
                    </span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Allergies</span>
                    <span className="settings-info-value">{user?.profile?.allergies || 'None Reported'}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Dietary Goal</span>
                    <span className="settings-info-value" style={{ textTransform: 'capitalize' }}>{user?.profile?.dietary_goal?.replace('_', ' ')}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-label">Activity Level</span>
                    <span className="settings-info-value" style={{ textTransform: 'capitalize' }}>{user?.profile?.activity_level?.replace('_', ' ')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>

      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
