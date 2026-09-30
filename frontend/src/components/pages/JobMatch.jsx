import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../style/matching.scss";
import Navbar from "../Navbar";
import { useResumes } from "../../features/resumes/hooks/useResumes";
import { useMatching } from "../../features/matching/hooks/useMatching";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const scoreTone = (score) => {
  if (score >= 75) return "tone-great";
  if (score >= 50) return "tone-good";
  if (score >= 30) return "tone-fair";
  return "tone-low";
};

// SVG score ring.
const ScoreRing = ({ score }) => {
  const r = 54;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className={`score-ring ${scoreTone(score)}`}>
      <svg viewBox="0 0 140 140" width="140" height="140" aria-hidden="true">
        <circle cx="70" cy="70" r={r} className="ring-track" />
        <circle
          cx="70"
          cy="70"
          r={r}
          className="ring-fill"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="ring-label">
        <span className="ring-score">{score}</span>
        <span className="ring-caption">match score</span>
      </div>
    </div>
  );
};

const BreakdownBar = ({ item }) => {
  const pct = item.maxScore === 0 ? 0 : (item.score / item.maxScore) * 100;
  return (
    <div className="breakdown-item">
      <div className="breakdown-head">
        <span className="breakdown-label">{item.label}</span>
        <span className="muted small">
          {item.skipped ? "skipped" : `${item.score}/${item.maxScore}`}
        </span>
      </div>
      <div className="breakdown-track">
        <div
          className={`breakdown-fill ${item.skipped ? "is-skipped" : ""}`}
          style={{ width: `${item.skipped ? 0 : pct}%` }}
        />
      </div>
      {item.details?.map((d, i) => (
        <p key={i} className="muted small breakdown-detail">
          {d}
        </p>
      ))}
    </div>
  );
};

const MatchResult = ({ match }) => {
  if (!match) return null;
  const breakdown = match.breakdown || [];
  return (
    <section className="match-result" aria-live="polite">
      <div className="result-top">
        <ScoreRing score={match.matchScore} />
        <div className="result-meta">
          <h2 className="result-title">{match.jobTitle}</h2>
          <p className="muted small">
            {match.resumeName ? `Matched against “${match.resumeName}”` : "Match result"} ·{" "}
            {formatDate(match.createdAt)}
          </p>
          {match.summary && <p className="result-summary">{match.summary}</p>}
        </div>
      </div>

      {(match.matchedSkills?.length > 0 || match.missingSkills?.length > 0) && (
        <div className="skills-block">
          {match.matchedSkills?.length > 0 && (
            <div className="skills-group">
              <h3 className="group-title">Skills found in your resume</h3>
              <div className="chip-row">
                {match.matchedSkills.map((s) => (
                  <span key={s} className="chip chip-matched">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {match.missingSkills?.length > 0 && (
            <div className="skills-group">
              <h3 className="group-title">Not found in your resume</h3>
              <div className="chip-row">
                {match.missingSkills.map((s) => (
                  <span key={s} className="chip chip-missing">
                    {s}
                  </span>
                ))}
              </div>
              <p className="muted small disclaimer">
                “Not found in the resume” means the skill wasn’t detected in the
                resume text — not that you don’t have it in real life.
              </p>
            </div>
          )}
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="breakdown-block">
          <h3 className="group-title">How the score was computed</h3>
          {breakdown.map((b, i) => (
            <BreakdownBar key={b.key || i} item={b} />
          ))}
        </div>
      )}

      {match.strengths?.length > 0 && (
        <div className="ai-block">
          <h3 className="group-title">Fit strengths</h3>
          <ul className="ai-list">
            {match.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {match.gaps?.length > 0 && (
        <div className="ai-block">
          <h3 className="group-title">Gaps to close</h3>
          <ul className="gap-list">
            {match.gaps.map((g, i) => (
              <li key={i} className="gap-item">
                <div className="gap-head">
                  <span className="gap-issue">{g.issue}</span>
                  <span className={`severity severity-${g.severity}`}>{g.severity}</span>
                </div>
                {g.suggestion && <p className="muted small">{g.suggestion}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.recommendations?.length > 0 && (
        <div className="ai-block">
          <h3 className="group-title">Recommended next steps</h3>
          <ol className="ai-list numbered">
            {match.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
};

const JobMatch = () => {
  const { resumes, loading: resumesLoading, fetchResumes } = useResumes();
  const {
    matches,
    current,
    loading: historyLoading,
    running,
    error,
    setError,
    fetchMatches,
    runMatch,
    fetchMatch,
    clearCurrent,
  } = useMatching();

  const [resumeId, setResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    fetchResumes()
      .then((items) => {
        // Default the picker to the primary resume once the list arrives.
        if (items?.length > 0) {
          const primary = items.find((r) => r.isPrimary) || items[0];
          setResumeId((prev) => prev || primary._id);
        }
      })
      .catch(() => {});
    fetchMatches().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!resumes.length) {
      setError("Save a resume first — add one from the Resumes page.");
      return;
    }
    if (!jobTitle.trim()) {
      setError("Provide a job title.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("The job description is too short (minimum 20 characters).");
      return;
    }
    try {
      const match = await runMatch({
        resumeId: resumeId || undefined,
        jobTitle,
        jobDescription,
      });
      setViewId(match._id);
    } catch {
      // error is already surfaced via the hook
    }
  };

  const onSelectHistory = async (id) => {
    clearCurrent();
    setViewId(id);
    try {
      await fetchMatch(id);
    } catch {
      // error is already surfaced via the hook
    }
  };

  const onNewMatch = () => {
    clearCurrent();
    setViewId(null);
  };

  return (
    <div className="match-page">
      <Navbar />
      <main className="match-container">
        <header className="page-head">
          <div>
            <h1>Job Match</h1>
            <p className="muted">
              See how well a resume fits a job posting — with an explainable
              score, skill gaps, and concrete next steps.
            </p>
          </div>
          {viewId && (
            <button type="button" className="button ghost-button" onClick={onNewMatch}>
              New match
            </button>
          )}
        </header>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="match-grid">
          <section className="panel match-form-panel">
            <h2 className="panel-title">Run a match</h2>
            <form onSubmit={onSubmit} className="match-form">
              <label className="field">
                <span className="field-label">Resume</span>
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  disabled={resumesLoading || running}
                  className="field-input"
                >
                  {resumesLoading && <option value="">Loading resumes…</option>}
                  {!resumesLoading && resumes.length === 0 && (
                    <option value="">No resumes yet</option>
                  )}
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                      {r.isPrimary ? " (primary)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Job title</span>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Backend Developer (Node.js)"
                  maxLength={120}
                  disabled={running}
                  className="field-input"
                />
              </label>

              <label className="field">
                <span className="field-label">Job description</span>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…"
                  rows={10}
                  maxLength={20000}
                  disabled={running}
                  className="field-input field-textarea"
                />
              </label>

              <button
                type="submit"
                className="button primary-button"
                disabled={running || resumesLoading}
              >
                {running ? "Matching…" : "Match resume to job"}
              </button>

              {resumes.length === 0 && !resumesLoading && (
                <p className="muted small">
                  You don’t have any resumes yet.{" "}
                  <Link to="/resumes">Add one from the Resumes page</Link>.
                </p>
              )}
            </form>

            <div className="history-block">
              <h2 className="panel-title">History</h2>
              {historyLoading && <p className="muted small">Loading history…</p>}
              {!historyLoading && matches.length === 0 && (
                <p className="muted small">No matches yet — run your first one above.</p>
              )}
              <ul className="history-list">
                {matches.map((m) => (
                  <li key={m._id}>
                    <button
                      type="button"
                      className={`history-item ${viewId === m._id ? "is-active" : ""}`}
                      onClick={() => onSelectHistory(m._id)}
                    >
                      <span className={`history-score ${scoreTone(m.matchScore)}`}>
                        {m.matchScore}
                      </span>
                      <span className="history-meta">
                        <span className="history-title">{m.jobTitle}</span>
                        <span className="muted small">
                          {m.resumeName || "Resume"} · {formatDate(m.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="result-column">
            {current ? (
              <MatchResult match={current} />
            ) : (
              <section className="panel result-empty">
                <h2 className="panel-title">Your result appears here</h2>
                <p className="muted">
                  Pick a resume, paste a job description, and run the match.
                  You’ll get a 0–100 score with a transparent breakdown of
                  exactly how it was computed.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobMatch;
