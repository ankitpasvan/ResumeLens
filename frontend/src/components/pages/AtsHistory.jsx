import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../style/ats.scss";
import AppLayout from "../layout/AppLayout";
import PageHeader from "../layout/PageHeader";
import EmptyState from "../ui/EmptyState";
import { useAts } from "../../features/ats/hooks/useAts";
import { scoreVerdict } from "../ats/AtsResult";

const PAGE_SIZE = 8;

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const jdSnippet = (text) =>
  text.slice(0, 80) + (text.length > 80 ? "…" : "");

const AtsHistory = () => {
  const { loading, analyses, error, fetchHistory } = useAts();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHistory().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Summary stats derived from the real analyses array (no fabrication).
  const total = analyses.length;
  const scores = analyses.map((a) => a.score ?? 0);
  const bestScore = total > 0 ? Math.max(...scores) : 0;
  const avgScore =
    total > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / total) : 0;
  const withJobDescription = analyses.filter((a) =>
    (a.jobDescription || "").trim(),
  ).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = analyses.filter(
      (a) => !q || (a.jobDescription || "").toLowerCase().includes(q),
    );
    const sorted = [...list];
    if (sort === "oldest") {
      sorted.sort(
        (x, y) => new Date(x.createdAt || 0) - new Date(y.createdAt || 0),
      );
    } else if (sort === "highest") {
      sorted.sort((x, y) => (y.score ?? 0) - (x.score ?? 0));
    } else if (sort === "lowest") {
      sorted.sort((x, y) => (x.score ?? 0) - (y.score ?? 0));
    } else {
      sorted.sort(
        (x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0),
      );
    }
    return sorted;
  }, [analyses, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <AppLayout>
      <div className="ats-page">
        <PageHeader
          glyph="◷"
          title="ATS History"
          subtitle="View and manage your past ATS analysis results. Track your progress and improvement over time."
        >
          <Link to="/ats" className="pg-btn pg-btn--primary">
            <span aria-hidden="true">✦</span> Analyze New Resume
          </Link>
        </PageHeader>

        {loading && (
          <div className="pg-loading" role="status" aria-label="Loading history">
            <span className="spinner spinner-lg" />
            <p>Loading history…</p>
          </div>
        )}

        {error && (
          <div className="pg-alert pg-alert--error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && total === 0 && (
          <EmptyState
            glyph="◷"
            title="No analyses yet"
            desc="Run your first ATS analysis and it will appear here."
            actionTo="/ats"
            actionLabel="Analyze a resume"
          />
        )}

        {!loading && !error && total > 0 && (
          <>
            <section className="pg-stats" aria-label="Analysis summary">
              <div className="pg-stat">
                <span className="pg-stat__icon" aria-hidden="true">
                  ▤
                </span>
                <span className="pg-stat__body">
                  <span className="pg-stat__value">{total}</span>
                  <span className="pg-stat__label">Total Analyses</span>
                  <span className="pg-stat__sub">All time</span>
                </span>
              </div>
              <div className="pg-stat">
                <span
                  className="pg-stat__icon pg-stat__icon--green"
                  aria-hidden="true"
                >
                  ★
                </span>
                <span className="pg-stat__body">
                  <span className="pg-stat__value">{bestScore}</span>
                  <span className="pg-stat__label">Best Score</span>
                  <span className="pg-stat__sub">
                    {scoreVerdict(bestScore).label}
                  </span>
                </span>
              </div>
              <div className="pg-stat">
                <span
                  className="pg-stat__icon pg-stat__icon--amber"
                  aria-hidden="true"
                >
                  ◎
                </span>
                <span className="pg-stat__body">
                  <span className="pg-stat__value">{avgScore}</span>
                  <span className="pg-stat__label">Average Score</span>
                  <span className="pg-stat__sub">
                    {scoreVerdict(avgScore).label}
                  </span>
                </span>
              </div>
              <div className="pg-stat">
                <span className="pg-stat__icon" aria-hidden="true">
                  ▦
                </span>
                <span className="pg-stat__body">
                  <span className="pg-stat__value">{withJobDescription}</span>
                  <span className="pg-stat__label">With Job Description</span>
                  <span className="pg-stat__sub">
                    {total - withJobDescription} resume-only checks
                  </span>
                </span>
              </div>
            </section>

            <div className="pg-filterbar">
              <label className="pg-search">
                <span className="pg-search__icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by job description…"
                  aria-label="Search analyses by job description"
                />
              </label>
              <select
                className="pg-select"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort analyses"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest score</option>
                <option value="lowest">Lowest score</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="pg-panel ats-no-results">
                <p className="muted">
                  No analyses match &ldquo;{query}&rdquo;.
                </p>
                <button
                  type="button"
                  className="pg-btn pg-btn--ghost"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <div className="pg-table-wrap">
                  <table className="pg-table">
                    <thead>
                      <tr>
                        <th scope="col">Analysis</th>
                        <th scope="col">Job Description</th>
                        <th scope="col">Missing Keywords</th>
                        <th scope="col">Date</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((a) => {
                        const score = a.score ?? 0;
                        const verdict = scoreVerdict(score);
                        const missing = (a.missingKeywords || []).length;
                        return (
                          <tr key={a._id}>
                            <td>
                              <div className="pg-cell-main">
                                <span
                                  className={`pg-cell-avatar ats-score-avatar ${verdict.className}`}
                                  aria-label={`Score ${score} out of 100`}
                                >
                                  {score}
                                </span>
                                <div>
                                  <div className="pg-cell-title">
                                    {verdict.label}
                                  </div>
                                  <div className="pg-cell-sub">ATS score</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {a.jobDescription ? (
                                <span className="ats-jd-snippet">
                                  {jdSnippet(a.jobDescription)}
                                </span>
                              ) : (
                                <span className="pg-cell-muted">
                                  Resume quality check
                                </span>
                              )}
                            </td>
                            <td>
                              {missing > 0 ? (
                                <span className="pg-badge pg-badge--amber">
                                  {missing} missing
                                </span>
                              ) : (
                                <span className="pg-badge pg-badge--slate">
                                  0
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="pg-cell-muted">
                                {formatDate(a.createdAt)}
                              </span>
                            </td>
                            <td>
                              <Link
                                to={`/ats/${a._id}`}
                                className="pg-btn pg-btn--ghost"
                              >
                                View Report
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pg-pagination">
                  <span className="pg-pagination__info">
                    Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} analyses
                  </span>
                  <div className="pg-pagination__controls">
                    <button
                      type="button"
                      className="pg-page-btn"
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          className={`pg-page-btn${p === safePage ? " pg-page-btn--active" : ""}`}
                          onClick={() => setPage(p)}
                          aria-current={p === safePage ? "page" : undefined}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className="pg-page-btn"
                      disabled={safePage >= pageCount}
                      onClick={() => setPage(safePage + 1)}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AtsHistory;
