import { NavLink, useLocation } from 'react-router-dom';

export default function SiteNavbar() {
  const { pathname } = useLocation();
  const resetIsActive = pathname === '/forgot-password' || pathname.startsWith('/reset-password');

  return (
    <nav className="navbar-custom">
      <div className="header-container">
        <NavLink
          className={({ isActive }) => `navbar-brand-custom${isActive ? ' active' : ''}`}
          to="/register"
        >
          <span className="brand-icon">
            <i className="bi bi-shield-lock-fill"></i>
          </span>
          <span>SecureReset</span>
        </NavLink>

        <div className="nav-links">
          <NavLink
            to="/register"
            className={({ isActive }) => `nav-btn ${isActive ? 'nav-btn-primary' : 'nav-btn-ghost'}`}
          >
            Register
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) => `nav-btn ${isActive ? 'nav-btn-primary' : 'nav-btn-ghost'}`}
          >
            Sign In
          </NavLink>
          <NavLink
            to="/forgot-password"
            className={`nav-btn ${resetIsActive ? 'nav-btn-primary' : 'nav-btn-ghost'}`}
          >
            Reset
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
