import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineX, 
  HiOutlineHome, 
  HiOutlineClipboardList, 
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineInformationCircle,
  HiOutlineLogout
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiOutlineHome, path: '/dashboard' },
    { id: 'diet-plan', label: 'Daily Diet Plan', icon: HiOutlineClipboardList, path: '/diet-plan' },
    { id: 'profile', label: 'My Profile', icon: HiOutlineUserCircle, path: '/profile' },
    { id: 'settings', label: 'Settings', icon: HiOutlineCog, path: '/settings' },
    { id: 'about', label: 'About', icon: HiOutlineInformationCircle, path: '/about' },
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="sidebar-overlay"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            onClick={onClose}
          />
          <motion.div 
            className="sidebar-panel"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
          >
            <div className="sidebar-header">
              <h3>Menu</h3>
              <button className="close-btn" onClick={onClose}>
                <HiOutlineX size={24} />
              </button>
            </div>

            <nav className="sidebar-nav-list">
              {menuItems.map((item) => (
                <button 
                  key={item.id}
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNav(item.path)}
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <button className="sidebar-logout-btn" onClick={handleLogout}>
                <HiOutlineLogout size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
