/**
 * AboutPage — Premium About page for NutriAI.
 * Showcases mission, features, and technology stack.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlineHeart,
  HiOutlineShieldCheck,
  HiOutlineChip,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineBeaker,
} from 'react-icons/hi';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: HiOutlineChip,
      title: 'AI-Powered Analysis',
      desc: 'Advanced GPT-4o-mini integration for personalized dietary recommendations based on your unique biometrics.',
      color: 'var(--accent-cyan)',
    },
    {
      icon: HiOutlineGlobe,
      title: 'Regional Cuisines',
      desc: 'Authentic meal plans from 10+ Indian regions including Punjab, J&K, Tamil Nadu, Kerala, and more.',
      color: 'var(--accent-purple)',
    },
    {
      icon: HiOutlineHeart,
      title: 'Health-First Approach',
      desc: 'Scientifically calculated BMR, TDEE, and macro splits tailored to your fitness goals.',
      color: 'var(--accent-pink)',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Secure & Private',
      desc: 'Bank-grade encryption, JWT authentication, and zero third-party data sharing.',
      color: 'var(--success)',
    },
    {
      icon: HiOutlineLightningBolt,
      title: 'Real-Time Insights',
      desc: 'Instant nutritional breakdowns with protein, carbs, and fat calculations per meal.',
      color: 'var(--accent-amber)',
    },
    {
      icon: HiOutlineSparkles,
      title: 'Smart Chatbot',
      desc: 'An AI nutrition assistant that answers your diet questions with expert-level knowledge.',
      color: 'var(--accent-blue)',
    },
  ];

  const techStack = [
    { name: 'React', role: 'Web Frontend' },
    { name: 'React Native', role: 'Mobile App' },
    { name: 'Flask', role: 'Backend API' },
    { name: 'MongoDB', role: 'Database' },
    { name: 'OpenAI GPT-4o', role: 'AI Engine' },
    { name: 'JWT', role: 'Authentication' },
  ];

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

      <main className="dashboard-main" style={{ maxWidth: '960px' }}>
        {/* Hero Section */}
        <motion.header
          className="welcome-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <div className="about-hero-badge">
            <HiOutlineBeaker size={14} />
            <span>About NutriAI</span>
          </div>
          <h1 className="greeting" style={{ fontSize: 'clamp(28px, 5vw, 44px)' }}>
            Nutrition, Reimagined with{' '}
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Artificial Intelligence
            </span>
          </h1>
          <p className="welcome-sub" style={{ maxWidth: '600px', margin: '16px auto 0', fontSize: '17px', lineHeight: '1.7' }}>
            NutriAI is an intelligent nutrition platform that combines cutting-edge AI with 
            regional food science to deliver hyper-personalized meal plans for every body type, 
            dietary preference, and fitness goal.
          </p>
        </motion.header>

        {/* Mission Statement */}
        <motion.section
          className="about-mission-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="about-glass-panel">
            <div className="about-mission-icon-row">
              <div className="about-mission-icon">
                <HiOutlineUserGroup size={28} />
              </div>
            </div>
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-section-text">
              We believe that personalized nutrition should not be a luxury. Our mission is to democratize 
              access to expert-level dietary guidance by leveraging AI to understand your unique body, 
              cultural food preferences, and health objectives — delivering actionable, science-backed 
              meal plans that actually work.
            </p>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          style={{ marginBottom: '64px' }}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.h2
            className="about-section-title"
            style={{ textAlign: 'center', marginBottom: '32px' }}
            variants={fadeUp}
          >
            What Makes Us Different
          </motion.h2>
          <div className="about-features-grid">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                className="about-feature-card"
                variants={fadeUp}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
              >
                <div
                  className="about-feature-icon"
                  style={{ color: feat.color, background: `${feat.color}15` }}
                >
                  <feat.icon size={24} />
                </div>
                <h3 className="about-feature-title">{feat.title}</h3>
                <p className="about-feature-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          style={{ marginBottom: '64px' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="about-section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>
            Built With Modern Tech
          </h2>
          <div className="about-tech-grid">
            {techStack.map((tech, idx) => (
              <motion.div
                key={tech.name}
                className="about-tech-chip"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.07 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="about-tech-name">{tech.name}</span>
                <span className="about-tech-role">{tech.role}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="about-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Made with ❤️ for health-conscious individuals everywhere.</p>
          <p className="about-version">NutriAI v1.0.0 — © {new Date().getFullYear()}</p>
        </motion.footer>
      </main>

      <div className="dashboard-decor-1" />
      <div className="dashboard-decor-2" />
    </div>
  );
}
