/* eslint-disable react-refresh/only-export-components -- scoreVerdict is a shared helper also used by AtsHistory */
export const scoreVerdict = (score) => {
  if (score >= 80) return { label: "Excellent", className: "verdict-excellent" };
  if (score >= 60) return { label: "Good", className: "verdict-good" };
  if (score >= 40) return { label: "Fair", className: "verdict-fair" };
  return { label: "Needs work", className: "verdict-poor" };
}

// SVG score ring (0-100).
const ScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const verdict = scoreVerdict(score);

  return (
    <div className="score-ring-wrap">
      <svg className="score-ring" width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} className="score-ring-track" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          className="score-ring-fill"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-number">{score}</span>
        <span className="score-max">/ 100</span>
      </div>
      <span className={`verdict ${verdict.className}`}>{verdict.label}</span>
    </div>
  );
};

// Shared renderer for a full ATS analysis object. Used by both the
// analyzer page (fresh result) and the detail page (from history).
const AtsResult = ({ analysis }) => {
  if (!analysis) return null;

  const breakdown = analysis.breakdown || [];
  const missingKeywords = analysis.missingKeywords || [];
  const strengths = analysis.strengths || [];
  const weaknesses = analysis.weaknesses || [];
  const suggestions = analysis.suggestions || [];

  return (
    <div className="ats-result">
      {/* Score hero */}
      <section className="ats-card score-hero">
        <ScoreRing score={analysis.score ?? 0} />
        <div className="score-hero-text">
          <h2>ATS Score</h2>
          {analysis.summary ? (
            <p className="ai-summary">{analysis.summary}</p>
          ) : (
            <p className="muted">Deterministic score with AI feedback below.</p>
          )}
          {analysis.createdAt && (
            <p className="muted small">
              Analyzed on {new Date(analysis.createdAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      {/* Score breakdown */}
      <section className="ats-card">
        <h3>Score breakdown</h3>
        <p className="muted small">
          Every point is awarded by a transparent rule — no black box.
        </p>
        <div className="breakdown-list">
          {breakdown.map((b) => {
            const pct = b.maxScore > 0 ? Math.round((b.score / b.maxScore) * 100) : 0;
            return (
              <div key={b.key || b.label} className="breakdown-item">
                <div className="breakdown-head">
                  <span className="breakdown-label">{b.label}</span>
                  <span className="breakdown-score">
                    {b.skipped ? (
                      <span className="skipped-badge">skipped</span>
                    ) : (
                      <>
                        {b.score}
                        <span className="muted"> / {b.maxScore}</span>
                      </>
                    )}
                  </span>
                </div>
                {!b.skipped && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
                {(b.details || []).map((d, i) => (
                  <p key={i} className="breakdown-detail muted small">
                    {d}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Missing keywords */}
      <section className="ats-card">
        <h3>Missing keywords</h3>
        {missingKeywords.length > 0 ? (
          <>
            <p className="muted small">
              Important terms from the job description that were not found in
              your resume. Add them only where they are genuinely true for you.
            </p>
            <div className="keyword-chips">
              {missingKeywords.map((kw) => (
                <span key={kw} className="keyword-chip keyword-missing">
                  {kw}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">
            {analysis.jobDescription
              ? "No important keywords missing — nice."
              : "Add a job description to get keyword-level feedback."}
          </p>
        )}
      </section>

      {/* AI feedback */}
      <section className="ats-card">
        <h3>AI feedback</h3>

        {strengths.length > 0 && (
          <div className="feedback-block">
            <h4 className="feedback-heading strengths-heading">Strengths</h4>
            <ul className="feedback-list">
              {strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {weaknesses.length > 0 && (
          <div className="feedback-block">
            <h4 className="feedback-heading weaknesses-heading">
              Weaknesses to fix
            </h4>
            <ul className="feedback-list weakness-list">
              {weaknesses.map((w, i) => (
                <li key={i}>
                  <div className="weakness-head">
                    <span>{w.issue}</span>
                    <span className={`severity severity-${w.severity || "medium"}`}>
                      {w.severity || "medium"}
                    </span>
                  </div>
                  {w.suggestion && <p className="muted small">{w.suggestion}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="feedback-block">
            <h4 className="feedback-heading suggestions-heading">
              Prioritized suggestions
            </h4>
            <ol className="feedback-list suggestions-list">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        )}

        {strengths.length === 0 &&
          weaknesses.length === 0 &&
          suggestions.length === 0 && (
            <p className="muted">No AI feedback available for this analysis.</p>
          )}
      </section>
    </div>
  );
};

export default AtsResult;
