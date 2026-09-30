import { Link, NavLink, useNavigate } from "react-router-dom";
import "../style/ats.scss";
import { useAuth } from "../features/auth/hooks/useAuth";

// Shared top navigation for the authenticated pages.
const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await handleLogout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <nav className="app-navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-mark">◈</span> ResumeLens
      </Link>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `navbar-link ${isActive ? "navbar-link-active" : ""}`
          }
        >
          Interview Prep
        </NavLink>
        <NavLink
          to="/ats"
          className={({ isActive }) =>
            `navbar-link ${isActive ? "navbar-link-active" : ""}`
          }
        >
          ATS Analyzer
        </NavLink>
        <NavLink
          to="/ats/history"
          className={({ isActive }) =>
            `navbar-link ${isActive ? "navbar-link-active" : ""}`
          }
        >
          History
        </NavLink>
      </div>

      <div className="navbar-user">
        {user?.username && <span className="navbar-username">{user.username}</span>}
        <button type="button" className="navbar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
