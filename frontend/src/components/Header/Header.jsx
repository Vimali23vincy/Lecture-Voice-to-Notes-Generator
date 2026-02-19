import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './index.css';
import { ThemeContext } from '../../ThemeContext';

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <header className="header">
      <div className="logo-container">
        <Link to="/" className="logo-link">
          <img src={logo} alt="SmartNotes Logo" className="logo" />
        </Link>
      </div>
      <nav className="nav-links">
        <Link to="/" className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/link" className={`nav-btn ${location.pathname === '/link' ? 'active' : ''}`}>YouTube</Link>
        <Link to="/record" className={`nav-btn ${location.pathname === '/record' ? 'active' : ''}`}>Live</Link>
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </nav>
    </header>
  );
};

export default Header;
