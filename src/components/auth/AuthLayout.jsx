/**
 * AuthLayout — Shared wrapper for all authentication pages.
 * Provides the animated background with floating orbs and grid.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function AuthLayout({ children }) {
  const location = useLocation();

  return (
    <div className="auth-scene">
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb--cyan" />
      <div className="auth-orb auth-orb--purple" />
      <div className="auth-orb auth-orb--blue" />

      {/* Grid overlay */}
      <div className="auth-grid" />

      {/* Page content with transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
