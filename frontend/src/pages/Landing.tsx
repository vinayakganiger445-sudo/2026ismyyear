import React from 'react';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">2026 Honesty Pledge</h1>
          <p className="hero-subtitle">
            Commit to your goals. Join a cohort. Build habits that last.
          </p>
          <p className="hero-description">
            Join 1000 others in small accountability groups. Daily check-ins at 8pm. 
            Earn points and badges as you stay consistent.
          </p>
          <div className="hero-cta">
            <button className="cta-button primary">Get Started</button>
            <button className="cta-button secondary">Learn More</button>
          </div>
        </div>
      </div>
      
      <div className="landing-features">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>10-Person Cohorts</h3>
            <p>Get matched with a small group for accountability and support</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Daily Check-ins</h3>
            <p>8pm reminders keep you on track with your commitments</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Points & Badges</h3>
            <p>Gamify your progress and celebrate your wins</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

