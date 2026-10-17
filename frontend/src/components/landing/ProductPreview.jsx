import ScoreRing from "../ui/ScoreRing";

// Realistic ATS-analysis preview built from the same visual language as the
// app. All numbers are STATIC SAMPLE DATA, clearly labelled — never presented
// as a live analysis.
const SAMPLE = {
  score: 82,
  breakdown: [
    { label: "Keyword match", value: 88 },
    { label: "Skills coverage", value: 79 },
    { label: "Experience relevance", value: 84 },
    { label: "Format & readability", value: 91 },
  ],
  missing: ["Kubernetes", "System Design", "CI/CD"],
};

const ProductPreview = () => {
  return (
    <div className="preview-wrap">
      <div className="preview-glow" aria-hidden="true" />
      <div className="preview-card">
        <div className="preview-card__head">
          <div>
            <p className="preview-card__title">ATS Analysis</p>
            <p className="preview-card__sub">senior-frontend-resume.pdf</p>
          </div>
          <span className="ui-badge ui-badge--violet">Sample preview</span>
        </div>
        <div className="preview-card__body">
          <ScoreRing score={SAMPLE.score} size={132} label="ATS score" />
          <div className="preview-breakdown">
            {SAMPLE.breakdown.map((b) => (
              <div className="preview-bar" key={b.label}>
                <div className="preview-bar__head">
                  <span>{b.label}</span>
                  <span className="preview-bar__val">{b.value}</span>
                </div>
                <div className="preview-bar__track">
                  <div
                    className="preview-bar__fill"
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="preview-missing">
              <span className="preview-missing__label">Missing keywords</span>
              <div className="preview-chips">
                {SAMPLE.missing.map((k) => (
                  <span className="preview-chip" key={k}>{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
