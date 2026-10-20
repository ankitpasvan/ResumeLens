import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import "../../style/sidebar.scss";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", glyph: "◈", end: true },
  { to: "/interview-prep", label: "Interview Prep", glyph: "✦", end: true },
  { to: "/ats", label: "ATS Analyzer", glyph: "◉", end: true },
  { to: "/resumes", label: "Resumes", glyph: "▤", end: false },
  { to: "/match", label: "Job Match", glyph: "◎", end: false },
  { to: "/jobs", label: "Jobs", glyph: "▦", end: false },
  { to: "/applications", label: "Applications", glyph: "☰", end: false },
  { to: "/ats/history", label: "History", glyph: "◷", end: false },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await handleLogout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const closeMobile = () => {
    if (onClose) onClose();
  };

  const initial = (user?.username || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <div
        className={`sidebar-backdrop${mobileOpen ? " sidebar-backdrop--open" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <aside className={`app-sidebar${mobileOpen ? " app-sidebar--open" : ""}`}>
        <Link to="/dashboard" className="sidebar-brand" onClick={closeMobile}>
          <span className="sidebar-brand__mark" aria-hidden="true">◈</span>
          <span className="sidebar-brand__name">ResumeLens</span>
        </Link>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
            >
              <span className="sidebar-link__glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="sidebar-link__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-cta">
          <span className="sidebar-cta__glyph" aria-hidden="true">✦</span>
          <p className="sidebar-cta__title">Improve your ATS score</p>
          <p className="sidebar-cta__text">
            Analyze your resume and fix what recruiters&apos; systems flag.
          </p>
          <Link to="/ats" className="sidebar-cta__button" onClick={closeMobile}>
            Analyze resume
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user__avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="sidebar-user__name">
              {user?.username || user?.email || "Account"}
            </span>
          </div>
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <span aria-hidden="true">↩</span> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
