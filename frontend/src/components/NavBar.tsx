import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
  const location = useLocation();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(15,23,42,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(148,163,184,0.2)',
    padding: '0.75rem 1rem',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const linkStyle: React.CSSProperties = {
    color: '#e5e7eb',
    textDecoration: 'none',
    fontSize: '0.9rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'background 0.2s',
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    background: 'rgba(34,197,94,0.2)',
    color: '#22c55e',
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <Link
        to="/"
        style={isActive('/') ? activeLinkStyle : linkStyle}
      >
        2026 Honesty Pledge
      </Link>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link
          to="/dashboard"
          style={isActive('/dashboard') ? activeLinkStyle : linkStyle}
        >
          Dashboard
        </Link>
        <Link
          to="/goals"
          style={isActive('/goals') ? activeLinkStyle : linkStyle}
        >
          Goals
        </Link>
        <Link
          to="/checkin"
          style={isActive('/checkin') ? activeLinkStyle : linkStyle}
        >
          Check-in
        </Link>
        <Link
          to="/profile"
          style={isActive('/profile') ? activeLinkStyle : linkStyle}
        >
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;

