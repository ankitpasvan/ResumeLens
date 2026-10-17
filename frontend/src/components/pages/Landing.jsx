import { Navigate } from "react-router-dom";
import "../../style/landing.scss";
import { useAuth } from "../../features/auth/hooks/useAuth";
import AuroraBackground from "../landing/AuroraBackground";
import LandingNav from "../landing/LandingNav";
import Hero from "../landing/Hero";
import FeatureGrid from "../landing/FeatureGrid";
import Workflow from "../landing/Workflow";
import LandingFooter from "../landing/LandingFooter";

// Public landing page. Authenticated users are sent to their dashboard.
const Landing = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="landing-loading" role="status" aria-label="Loading">
        <span className="ui-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <AuroraBackground />
      <LandingNav />
      <main className="landing-main">
        <Hero />
        <FeatureGrid />
        <Workflow />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
