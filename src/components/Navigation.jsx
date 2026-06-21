import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.tsx';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-mark" aria-hidden="true">DS</span>
          <span className="logo-text">Portfolio</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/spell-browser"
            className={`nav-link ${location.pathname === '/spell-browser' ? 'active' : ''}`}
          >
            D&D Spell Browser
          </Link>
          <Link
            to="/fluid-simulation"
            className={`nav-link ${location.pathname === '/fluid-simulation' ? 'active' : ''}`}
          >
            Fluid Simulation
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navigation;
