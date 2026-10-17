import { Link } from "react-router-dom";
import SectionHeading from "../ui/SectionHeading";
import Card from "../ui/Card";

// Only features that actually work in the app today. Each card links to the
// real feature (behind auth) — no dead CTAs.
const FEATURES = [
  {
    glyph: "◉",
    tone: "violet",
    title: "ATS Analysis",
    desc: "Upload your resume and get an explainable score with keyword gaps, missing skills, and concrete fixes.",
    to: "/ats",
    cta: "Analyze resume",
  },
  {
    glyph: "▤",
    tone: "emerald",
    title: "Resume Management",
    desc: "Keep every version in one place, mark a primary resume, and track how it evolves.",
    to: "/resumes",
    cta: "Manage resumes",
  },
  {
    glyph: "◎",
    tone: "violet",
    title: "Job Matching",
    desc: "Match your resume against any job description and see matching skills, gaps, and a real match score.",
    to: "/match",
    cta: "Match a job",
  },
  {
    glyph: "✦",
    tone: "emerald",
    title: "Interview Preparation",
    desc: "Generate role-specific interview questions, model answers, and a prep roadmap from your background.",
    to: "/interview-prep",
    cta: "Prepare now",
  },
];

const FeatureGrid = () => {
  return (
    <section className="landing-section" id="features">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to get hired"
        desc="Four tools that work together — from the first upload to the final interview."
      />
      <div className="landing-features">
        {FEATURES.map((f) => (
          <Card key={f.title} className="landing-feature">
            <span className={`landing-feature__glyph landing-feature__glyph--${f.tone}`} aria-hidden="true">
              {f.glyph}
            </span>
            <h3 className="landing-feature__title">{f.title}</h3>
            <p className="landing-feature__desc">{f.desc}</p>
            <Link to={f.to} className="landing-feature__link">
              {f.cta} →
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FeatureGrid;
