import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../../style/ats.scss";
import Navbar from "../Navbar";
import { useAts } from "../../features/ats/hooks/useAts";
import { scoreVerdict } from "../ats/AtsResult";

const AtsHistory = () => {
  const { loading, analyses, error, fetchHistory } = useAts();

  useEffect(() => {
    fetchHistory().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="ats-page">
      <Navbar />

      <div className="ats-container">
        <header className="ats-header">
          <h1>
            Analysis <span className="gradient-text">History</span>
          </h1>
          <p>Every ATS analysis you have run, newest first.</p>
          <Link to="/ats" className="ats-link">
            ← Run a new analysis
          </Link>
        </header>

        {loading && (
          <section className="ats-card ats-loading-card">
            <span className="spinner spinner-lg" />
            <p>Loading history…</p>
          </section>
        )}

        {error && <p className="ats-error">{error}</p>}

        {!loading && !error && analyses.length === 0 && (
          <section className="ats-card">
            <p className="muted">
              No analyses yet.{" "}
              <Link to="/ats" className="ats-link">
                Analyze your first resume
              </Link>
              .
            </p>
          </section>
        )}

        {!loading && analyses.length > 0 && (
          <div className="history-list">
            {analyses.map((a) => {
              const verdict = scoreVerdict(a.score ?? 0);
              return (
                <Link key={a._id} to={`/ats/${a._id}`} className="history-item">
                  <div
                    className={`history-score ${verdict.className}`}
                    aria-label={`Score ${a.score} out of 100`}
                  >
                    {a.score}
                  </div>
                  <div className="history-meta">
                    <p className="history-title">
                      {a.jobDescription
                        ? a.jobDescription.slice(0, 80) +
                          (a.jobDescription.length > 80 ? "…" : "")
                        : "Resume quality check"}
                    </p>
                    <p className="muted small">
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleString()
                        : ""}
                      {(a.missingKeywords || []).length > 0 &&
                        ` · ${(a.missingKeywords || []).length} missing keywords`}
                    </p>
                  </div>
                  <span className="history-arrow">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default AtsHistory;
