import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import './Landing.css';

const Landing: React.FC = () => {
  return (
    <div className="landing">
      <NavBar />
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">Make 2026 the year you actually keep your promises.</h1>
          <p className="hero-subtitle">
            Take the 2026 Honesty Pledge: set your goals, get matched with someone chasing something similar, check in daily, and climb the weekly leaderboard together.
          </p>
          <p className="hero-description">
            The 2026 Honesty Pledge is a one-year commitment with daily check-ins and a public weekly leaderboard. One cheat can cost your whole 2026.
          </p>

          <div className="cta-group">
            <Link to="/auth">
              <button className="cta-button primary">
                Start your 2026 pledge
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <h2 style={{ color: 'white', fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
          How it works
        </h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Set your goals for 2026.</h3>
            <p>Define your targets for the whole year. You can change them later, but the point is to commit.</p>
          </div>
          <div className="feature-card">
            <h3>Check in honestly every day.</h3>
            <p>Mark which goals you hit today. Your weekly score and streak depend on your honesty.</p>
          </div>
          <div className="feature-card">
            <h3>Climb the weekly leaderboard or watch yourself slip.</h3>
            <p>See how you rank against others. Higher points mean more consistent weeks.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;

