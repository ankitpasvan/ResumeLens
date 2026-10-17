import Button from "../ui/Button";
import ProductPreview from "./ProductPreview";

// Hero: strong headline, dual CTA, and a realistic product preview below.
const Hero = () => {
  return (
    <section className="landing-hero ui-enter">
      <div className="landing-hero__copy">
        <span className="ui-badge ui-badge--violet landing-hero__eyebrow">
          AI resume analysis
        </span>
        <h1 className="landing-hero__title">
          Know exactly how your resume{" "}
          <span className="landing-hero__gradient">scores</span> — before
          recruiters do.
        </h1>
        <p className="landing-hero__sub">
          ResumeLens analyzes your resume against real job descriptions, gives
          you an explainable ATS score, finds your skill gaps, and prepares
          you for interviews — all in one place.
        </p>
        <div className="landing-hero__ctas">
          <Button to="/register" size="lg">Get Started</Button>
          <Button to="#features" variant="secondary" size="lg">Explore Features</Button>
        </div>
        <p className="landing-hero__note">Free to start · No credit card required</p>
      </div>
      <ProductPreview />
    </section>
  );
};

export default Hero;
