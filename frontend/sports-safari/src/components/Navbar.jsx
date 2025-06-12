import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';

function Navbar() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleProtectedClick = (path, requiredRole) => (e) => {
    if (!isAuthenticated || (requiredRole && role !== requiredRole)) {
      e.preventDefault();
      navigate('/login', { state: { from: path } });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/">
            <img src="/Logo.gif" alt="Sports Safari" className="logo" />
          </NavLink>
        </div>

        <div className="navbar-links">
          {/* Always visible links */}
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Home
          </NavLink>

          {/* User-specific links */}
          {isAuthenticated && role === 'user' && (
            <>
              
              <NavLink
                to="/my-bookings"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={handleProtectedClick('/my-bookings', 'user')}
              >
                My Bookings
              </NavLink>
            </>
          )}

          {/* Owner-specific links */}
          {isAuthenticated && role === 'owner' && (
            <>
              <NavLink
                to="/add-ground"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Add Ground
              </NavLink>
              <NavLink
                to="/view-grounds"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                My Grounds
              </NavLink>
            </>
          )}

          {/* Common links */}
          <NavLink
            to="/about"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            About
          </NavLink>
        </div>

        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-controls">
              <span className="welcome-msg">Welcome, {user?.name}</span>
              <button 
                onClick={logout}
                className="logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <NavLink
                to="/login"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;