import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";

// Public landing navbar. Separate from the authenticated app Navbar.
const LandingNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className={`landing-nav${open ? " landing-nav--open" : ""}`}>
      <Link to="/" className="landing-nav__brand" onClick={() => setOpen(false)}>
        <span className="landing-nav__mark" aria-hidden="true">◈</span>
        ResumeLens
      </Link>

      <button
        type="button"
        className="landing-nav__toggle"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className="landing-nav__links" aria-label="Landing">
        <a href="#features" onClick={() => setOpen(false)}>Features</a>
        <a href="#workflow" onClick={() => setOpen(false)}>How it works</a>
        <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
      </nav>

      <div className="landing-nav__cta">
        <Button to="/register" size="sm">Get Started</Button>
      </div>
    </header>
  );
};

export default LandingNav;
