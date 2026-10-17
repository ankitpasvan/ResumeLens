import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../style/navbar.scss";
import { useAuth } from "../features/auth/hooks/useAuth";

// Shared top navigation for the authenticated pages.
// On mobile (≤900px) the links collapse behind a hamburger menu.
const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    try {
      await handleLogout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const links = [
    { to: "/", label: "Interview Prep", end: true },
    { to: "/ats", label: "ATS Analyzer" },
    { to: "/resumes", label: "Resumes" },
    { to: "/match", label: "Job Match" },
    { to: "/jobs", label: "Jobs" },
    { to: "/applications", label: "Applications" },
    { to: "/ats/history", label: "History" },
  ];

  return (
    <nav className={`app-navbar${menuOpen ? " menu-open" : ""}`}>
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <span className="brand-mark">◈</span> ResumeLens
      </Link>

      <button
        type="button"
        className="navbar-toggle"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="navbar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={closeMenu}
            className={({ isActive }) =>
              `navbar-link ${isActive ? "navbar-link-active" : ""}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-user">
        {user?.username && (
          <span className="navbar-username">{user.username}</span>
        )}
        <button type="button" className="navbar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
