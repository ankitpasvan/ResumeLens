import { Link } from "react-router-dom";
import Button from "../ui/Button";

const LandingFooter = () => {
  return (
    <footer className="landing-footer">
      <div className="landing-cta">
        <h2 className="landing-cta__title">Stop guessing. Start knowing.</h2>
        <p className="landing-cta__desc">
          Upload your resume and see your ATS score in under a minute.
        </p>
        <Button to="/register" size="lg">Get Started Free</Button>
      </div>
      <div className="landing-footer__bar">
        <Link to="/" className="landing-footer__brand">
          <span aria-hidden="true">◈</span> ResumeLens
        </Link>
        <nav className="landing-footer__links" aria-label="Footer">
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </nav>
        <p className="landing-footer__copy">
          © {new Date().getFullYear()} ResumeLens. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
