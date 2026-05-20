import { Link, NavLink, useLocation } from 'react-router-dom';

export default function SiteNavbar() {
  const { pathname } = useLocation();
  const resetIsActive = pathname === '/forgot-password' || pathname.startsWith('/reset-password');

  return (
    <nav className="navbar-custom">
      <div className="header-container">
        <Link className="navbar-brand-custom" to="/forgot-password">
          <span className="brand-icon">
            <i className="bi bi-shield-lock-fill"></i>
          </span>
          <span>SecureReset</span>
        </Link>
        
        <div className="nav-links">
          <NavLink
            to="/login"
            className={({ isActive }) => `nav-btn ${isActive ? 'nav-btn-primary' : 'nav-btn-ghost'}`}
          >
            Sign In
          </NavLink>
          <Link to="/forgot-password" className={`nav-btn ${resetIsActive ? 'nav-btn-primary' : 'nav-btn-ghost'}`}>
            Reset
          </Link>
        </div>
      </div>
    </nav>
  );
}
