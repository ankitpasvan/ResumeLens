import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../features/auth/hooks/useAuth";
import "../../style/app-layout.scss";
import "../../style/app-pages.scss";

// Shared authenticated layout: left sidebar + top bar + content area.
// The top bar search is functional: it opens the Jobs page filtered by the
// query (the Jobs page reads the `q` search param). Page titles live in the
// content via the PageHeader component, matching the reference design.
const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const initial = (user?.username || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
  };

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="app-header__menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <form
            className="app-header__search"
            role="search"
            onSubmit={handleSearch}
          >
            <span className="app-header__search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, companies, or roles…"
              aria-label="Search jobs"
            />
          </form>

          <div className="app-header__user">
            <span className="app-header__avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="app-header__user-name">
              {user?.username || user?.email || "Account"}
            </span>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
