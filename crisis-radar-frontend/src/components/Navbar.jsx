import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="topnav">
      <div className="nav-inner">
        <NavLink className="brand" to="/" aria-label="Crisis Radar home">
          <span className="dot"></span>
          <span>Crisis Radar</span>
        </NavLink>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span></span><span></span><span></span>
        </button>

        <nav className={`navlinks ${open ? 'open' : ''}`}>
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/map" className={navClass}>Live Map</NavLink>
          <NavLink to="/report" className={navClass}>Report</NavLink>
          <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
          <NavLink to="/insights" className={navClass}>Insights</NavLink>
        </nav>

        <div className={`nav-right ${open ? 'open' : ''}`}>
          {user ? (
            <>
              <span className="nav-user">{user.name} · {user.role}</span>
              <button
                className="btn btn-ghost-light btn-sm"
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              Log in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
