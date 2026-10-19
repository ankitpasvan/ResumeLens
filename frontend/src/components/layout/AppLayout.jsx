import { useState } from "react";
import Sidebar from "./Sidebar";
import "../../style/app-layout.scss";

// Shared authenticated layout: left sidebar + top header + content area.
// All protected pages render inside this layout.
const AppLayout = ({ children, title, subtitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="app-header__titles">
            {title && <h1 className="app-header__title">{title}</h1>}
            {subtitle && <p className="app-header__subtitle">{subtitle}</p>}
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
