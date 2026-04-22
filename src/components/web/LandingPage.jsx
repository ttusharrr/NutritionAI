import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowRight,
  FiZap,
  FiGlobe,
  FiActivity,
  FiShield,
  FiMessageSquare,
  FiChevronDown
} from 'react-icons/fi';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      // Parallax intensity
      const scrolledVal = window.scrollY;
      document.documentElement.style.setProperty('--scroll-y', `${scrolledVal}px`);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="premium-landing">
      {/* Immersive Background */}
      <div className="nebula-glow nebula-1"></div>
      <div className="nebula-glow nebula-2"></div>

      {/* Navigation */}
      <nav className={`premium-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="brand">
            <span className="brand-logo">NUTRI<span className="brand-accent">AI</span></span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => navigate('/auth/login')}>Login</button>
            <button className="nav-btn" onClick={() => navigate('/auth/signup')}>
              Join Protocol
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="immersive-hero">
        <div className="hero-grid">
          <div className="hero-text-area">
            <div className="protocol-badge reveal">
              <span className="pulse-dot"></span>
              SYSTEM STATUS: OPTIMIZED
            </div>
            <h1 className="hero-headline reveal">
              PERSONALIZED<br />
              <span className="gradient-text">NUTRITION</span><br />
              REDEFINED.
            </h1>
            <p className="hero-subtext reveal">
              A high-precision diet protocol engineered through agentic reasoning and regional culinary intelligence.
            </p>
            <div className="hero-actions reveal">
              <button className="cta-primary" onClick={() => navigate('/auth/signup')}>
                GET STARTED <FiArrowRight className="cta-icon" />
              </button>
              <button className="cta-secondary" onClick={() => window.scrollTo(0, 1000)}>
                EXPLORE PROTOCOL
              </button>
            </div>
          </div>

          <div className="hero-visual-area reveal">
            <div className="video-wrapper">
              <video
                className="hero-video-clean"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/texture_map.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <FiChevronDown />
        </div>
      </section>

      {/* Features - The Three Pillars */}
      <section className="pillars-section">
        <div className="pillars-header reveal">
          <h2 className="pillars-title">The Three Pillars</h2>
          <p className="pillars-subtitle">Precision engineering for your biological health.</p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card reveal">
            <div className="pillar-icon-box">
              <FiGlobe />
            </div>
            <h3>Cultural Intelligence</h3>
            <p>We've indexed over 10 regional Indian kitchens. Punjab to Kerala—localized for your DNA.</p>
            <div className="pillar-border"></div>
            <div className="pillar-glow"></div>
          </div>

          <div className="pillar-card reveal">
            <div className="pillar-icon-box">
              <FiZap />
            </div>
            <h3>Dynamic Protocol</h3>
            <p>Real-time macro adjustments based on your daily activity and physiological feedback.</p>
            <div className="pillar-border"></div>
            <div className="pillar-glow"></div>
          </div>

          <div className="pillar-card reveal">
            <div className="pillar-icon-box">
              <FiMessageSquare />
            </div>
            <h3>Agentic Insights</h3>
            <p>Your personal AI expert remains active 24/7 to adjust recipes and explain the science.</p>
            <div className="pillar-border"></div>
            <div className="pillar-glow"></div>
          </div>
        </div>
      </section>


      {/* Protocol Intelligence Section */}
      <section className="protocol-intel-section">
        <div className="intel-container">
          <div className="intel-header reveal">
            <h2 className="section-title">Agentic <span className="gradient-text">Reasoning</span></h2>
            <p className="section-subtitle">A multi-layered protocol engineered for precision.</p>
          </div>

          <div className="intel-flow">
            <div className="intel-node-wrapper reveal">
              <div className="intel-node">
                <FiActivity />
              </div>
              <h4>Biometrics</h4>
              <p>Metabolic baseline analysis.</p>
            </div>

            <div className="intel-connector reveal"></div>

            <div className="intel-node-wrapper reveal">
              <div className="intel-node">
                <FiGlobe />
              </div>
              <h4>Cultural DNA</h4>
              <p>Regional culinary indexing.</p>
            </div>

            <div className="intel-connector reveal"></div>

            <div className="intel-node-wrapper reveal">
              <div className="intel-node">
                <FiZap />
              </div>
              <h4>Protocol</h4>
              <p>Dynamic macro allocation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Quote */}
      <section className="scientific-quote reveal">
        <div className="quote-wrap">
          <FiShield className="shield-icon" />
          <blockquote>
            "NutriAI replaces the guesswork of dieting with a purely scientific, regionalized data protocol."
          </blockquote>
          <cite>— DR. ELENA VANCE, PROTOCOL LEAD</cite>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta reveal">
        <div className="cta-card">
          <h2>READY TO START YOUR PROTOCOL?</h2>
          <p>Join thousands of users optimizing their health through NutriAI.</p>
          <button className="cta-primary lg" onClick={() => navigate('/auth/signup')}>
            CREATE YOUR ACCOUNT
          </button>
        </div>
      </section>

      <footer className="premium-footer">
        <div className="footer-line"></div>
        <div className="footer-inner">
          <span className="brand-logo sm">NUTRI<span className="brand-accent">AI</span></span>
          <p>© 2026 NUTRI-AI PROTOCOL. ALL DATA ENCRYPTED.</p>
          <div className="footer-links">
            <a href="#hero">Terms</a>
            <a href="#hero">Privacy</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --brand-primary: #2dd4bf;
          --brand-secondary: #a855f7;
          --brand-black: #000000;
          --brand-dark: #0a0e1a;
          --text-gray: #94a3b8;
          scroll-behavior: smooth;
        }

        .premium-landing {
          background-color: var(--brand-black);
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* Nebula Backgrounds */
        .nebula-glow {
          position: fixed;
          width: 80vw;
          height: 80vh;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.1;
          pointer-events: none;
          z-index: 0;
        }
        .nebula-1 { background: radial-gradient(circle, var(--brand-primary), transparent); top: -20%; left: -20%; }
        .nebula-2 { background: radial-gradient(circle, var(--brand-secondary), transparent); bottom: -20%; right: -20%; }

        /* Navigation */
        .premium-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 90px;
          display: flex;
          align-items: center;
          padding: 0 8%;
          z-index: 1000;
          transition: all 0.4s ease;
        }
        .nav-scrolled {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          height: 70px;
        }
        .nav-container { width: 100%; display: flex; justify-content: space-between; align-items: center; }
        
        .brand-logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
        .brand-accent { color: var(--brand-primary); }
        
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-link { background: none; border: none; color: var(--text-gray); font-weight: 600; cursor: pointer; transition: 0.3s; }
        .nav-link:hover { color: white; }
        .nav-btn {
          background: white;
          color: black;
          border: none;
          padding: 10px 24px;
          border-radius: 99px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: 0.3s;
        }
        .nav-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,255,255,0.2); }

        /* Hero */
        .immersive-hero {
          min-height: 100vh;
          padding: 140px 4% 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 10;
          overflow: hidden;
        }
        .hero-grid { 
          display: grid; 
          grid-template-columns: 0.7fr 1.3fr;
          gap: 40px; 
          align-items: center; 
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .protocol-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 30px;
        }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-primary); box-shadow: 0 0 10px var(--brand-primary); animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .hero-headline { font-size: clamp(48px, 8vw, 100px); line-height: 0.9; font-weight: 900; letter-spacing: -4px; margin-bottom: 24px; }
        .gradient-text { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .hero-subtext { font-size: 20px; color: var(--text-gray); max-width: 550px; line-height: 1.6; margin-bottom: 40px; }
        
        .hero-actions { display: flex; gap: 20px; }
        .cta-primary {
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          border: none;
          padding: 18px 36px;
          border-radius: 12px;
          color: white;
          font-weight: 800;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: 0.4s;
        }
        .cta-primary:hover { transform: translateY(-4px); box-shadow: 0 10px 40px rgba(45, 212, 191, 0.3); }
        .cta-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 18px 36px; border-radius: 12px; color: white; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .cta-secondary:hover { background: rgba(255,255,255,0.1); }

        .video-wrapper {
          position: relative;
          width: 115%;
          margin-left: 5%;
          overflow: hidden;
          transform: translateY(calc(var(--scroll-y, 0px) * 0.1));
          transition: transform 0.1s ease-out;
          mask-image: linear-gradient(to right, transparent, black 10%);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%);
        }
        
        .hero-video-clean {
          width: 100%;
          height: 600px;
          display: block;
          object-fit: cover;
          opacity: 0.9;
          filter: brightness(1.1) contrast(1.1);
          border-radius: 0 40px 40px 0;
        }
        
        .data-chip {
          position: absolute;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          z-index: 20;
        }
        .chip-1 { top: 10%; right: 0; animation: chipFloat 5s ease-in-out infinite; }
        .chip-2 { bottom: 20%; left: -20px; animation: chipFloat 5s ease-in-out infinite reverse; }
        @keyframes chipFloat { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, -15px); } }

        .scroll-indicator { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); color: var(--text-gray); font-size: 24px; animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } }

        /* Pillars Section */
        .pillars-section { padding: 120px 8%; border-top: 1px solid rgba(255,255,255,0.05); background: linear-gradient(to bottom, #000, #050505); }
        .pillars-header { text-align: center; margin-bottom: 80px; }
        .pillars-title { font-size: 48px; font-weight: 900; margin-bottom: 20px; }
        .pillars-subtitle { font-size: 20px; color: var(--text-gray); }

        .pillars-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .pillar-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 60px 40px;
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          transition: 0.4s;
        }
        .pillar-card:hover { transform: translateY(-10px); background: rgba(255,255,255,0.04); border-color: rgba(45, 212, 191, 0.2); }
        .pillar-card h3 { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
        .pillar-card p { color: var(--text-gray); line-height: 1.6; }
        .pillar-icon-box { font-size: 40px; color: var(--brand-primary); margin-bottom: 30px; }
        .pillar-border { position: absolute; bottom: 0; left: 0; width: 0; height: 3px; background: var(--brand-primary); transition: 0.4s; }
        .pillar-card:hover .pillar-border { width: 100%; }
        .pillar-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(45, 212, 191, 0.1), transparent 70%);
          opacity: 0;
          transition: 0.4s;
          pointer-events: none;
        }
        .pillar-card:hover .pillar-glow { opacity: 1; }


        /* Protocol Intel */
        .protocol-intel-section { padding: 120px 8%; background: #000; position: relative; }
        .intel-container { max-width: 1000px; margin: 0 auto; text-align: center; }
        .intel-flow { display: flex; align-items: flex-start; justify-content: space-between; margin-top: 80px; position: relative; }
        
        .intel-node-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 10; }
        .intel-node {
          width: 80px;
          height: 80px;
          background: rgba(45, 212, 191, 0.1);
          border: 1px solid var(--brand-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: var(--brand-primary);
          margin-bottom: 24px;
          box-shadow: 0 0 30px rgba(45, 212, 191, 0.2);
          transition: 0.4s;
        }
        .intel-node-wrapper:hover .intel-node { transform: scale(1.1); box-shadow: 0 0 50px rgba(45, 212, 191, 0.4); }
        .intel-node-wrapper h4 { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        .intel-node-wrapper p { font-size: 14px; color: var(--text-gray); max-width: 200px; }
        
        .intel-connector {
          flex: 1;
          height: 2px;
          background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
          margin-top: 40px;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 1.5s var(--ease-out-expo), opacity 1.5s var(--ease-out-expo);
        }
        .intel-connector.reveal-active {
          opacity: 0.3;
          transform: scaleX(1);
        }

        @media (max-width: 768px) {
          .intel-flow { flex-direction: column; align-items: center; gap: 60px; }
          .intel-connector { width: 2px; height: 60px; margin: 0; }
        }

        /* Scientific Quote */
        .scientific-quote { padding: 120px 8%; display: flex; justify-content: center; }
        .quote-wrap { text-align: center; max-width: 800px; }
        .shield-icon { font-size: 60px; color: rgba(255,255,255,0.1); margin-bottom: 40px; }
        blockquote { font-size: 32px; font-weight: 700; line-height: 1.4; color: white; margin-bottom: 30px; }
        cite { font-size: 14px; font-weight: 800; color: var(--brand-primary); letter-spacing: 2px; }

        /* CTA */
        .final-cta { padding: 80px 8%; }
        .cta-card {
          background: linear-gradient(135deg, #111, #000);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 100px 40px;
          border-radius: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-card::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(45, 212, 191, 0.1), transparent); }
        .cta-card h2 { font-size: 48px; font-weight: 900; margin-bottom: 20px; position: relative; z-index: 10; }
        .cta-card p { font-size: 20px; color: var(--text-gray); margin-bottom: 40px; position: relative; z-index: 10; }
        .cta-primary.lg { margin: 0 auto; padding: 24px 60px; font-size: 18px; position: relative; z-index: 10; }

        /* Footer */
        .premium-footer { padding: 60px 8%; }
        .footer-line { height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 40px; }
        .footer-inner { display: flex; justify-content: space-between; align-items: center; }
        .footer-inner p { color: var(--text-gray); font-size: 12px; }
        .footer-links { display: flex; gap: 30px; }
        .footer-links a { color: var(--text-gray); font-size: 12px; transition: 0.3s; }
        .footer-links a:hover { color: white; }

        @media (max-width: 968px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; padding-top: 60px; }
          .hero-subtext { margin-left: auto; margin-right: auto; }
          .hero-actions { justify-content: center; }
          .orb-wrapper { margin: 0 auto; max-width: 400px; }
          .chip-2 { left: 0; }
          .footer-inner { flex-direction: column; gap: 40px; }
        }
      `}} />
    </div>
  );
};

export default LandingPage;
