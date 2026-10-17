import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../style/dashboard.scss";
import Navbar from "../Navbar";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  getDashboardStats,
  getRecommendations,
} from "../../features/dashboard/services/dashboard.api";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Spinner from "../ui/Spinner";
import ScoreRing from "../ui/ScoreRing";

const QUICK_LINKS = [
  { to: "/ats", glyph: "◉", label: "ATS Analyzer", desc: "Score your resume" },
  { to: "/resumes", glyph: "▤", label: "Resumes", desc: "Manage versions" },
  { to: "/match", glyph: "◎", label: "Job Match", desc: "Match a job post" },
  { to: "/jobs", glyph: "▦", label: "Jobs", desc: "Browse & save jobs" },
  { to: "/applications", glyph: "☰", label: "Applications", desc: "Track pipeline" },
  { to: "/interview-prep", glyph: "✦", label: "Interview Prep", desc: "Practice questions" },
];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Fetch-on-mount + retry. All setState calls happen inside async
  // callbacks (never synchronously in the effect body).
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [s, r] = await Promise.all([
          getDashboardStats(),
          getRecommendations(6),
        ]);
        if (cancelled) return;
        setStats(s);
        setRecommendations(r);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setRetryKey((k) => k + 1);
  };

  return (
    <>
      <Navbar />
      <main className="dashboard">
        <div className="dashboard__inner ui-enter">
          <header className="dashboard__head">
            <div>
              <h1 className="dashboard__title">
                Welcome back{user?.username ? `, ${user.username}` : ""}
              </h1>
              <p className="dashboard__sub">
                Here&apos;s your career command center.
              </p>
            </div>
            <Button to="/ats" variant="secondary" size="sm">
              New analysis
            </Button>
          </header>

          {loading && (
            <div className="dashboard__loading" role="status" aria-label="Loading dashboard">
              <Spinner label="Loading dashboard…" />
              <p>Loading your dashboard…</p>
            </div>
          )}

          {!loading && error && (
            <div className="dashboard__error" role="alert">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              <section className="dashboard__stats" aria-label="Statistics">
                <Card className="stat-card">
                  <span className="stat-card__value">{stats.resumes?.total ?? 0}</span>
                  <span className="stat-card__label">Resumes</span>
                  <Link to="/resumes" className="stat-card__link">Manage →</Link>
                </Card>
                <Card className="stat-card">
                  <span className="stat-card__value">{stats.analyses?.avgScore ?? 0}</span>
                  <span className="stat-card__label">Avg ATS score</span>
                  <Link to="/ats/history" className="stat-card__link">History →</Link>
                </Card>
                <Card className="stat-card">
                  <span className="stat-card__value">{stats.applications?.total ?? 0}</span>
                  <span className="stat-card__label">Applications</span>
                  <Link to="/applications" className="stat-card__link">Pipeline →</Link>
                </Card>
                <Card className="stat-card">
                  <span className="stat-card__value">{stats.interviews?.total ?? 0}</span>
                  <span className="stat-card__label">Interview preps</span>
                  <Link to="/interview-prep" className="stat-card__link">Practice →</Link>
                </Card>
              </section>

              <div className="dashboard__grid">
                <section aria-label="Recent analyses">
                  <Card title="Recent ATS analyses" sub="Your latest resume scores">
                    {stats.analyses?.recent?.length > 0 ? (
                      <ul className="dashboard__list">
                        {stats.analyses.recent.map((a) => (
                          <li key={a.id}>
                            <Link to={`/ats/${a.id}`} className="dashboard__row">
                              <ScoreRing score={a.score} size={52} stroke={6} label="" />
                              <div>
                                <p className="dashboard__row-title">Score {a.score}/100</p>
                                <p className="dashboard__row-sub">{formatDate(a.createdAt)}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        glyph="◉"
                        title="No analyses yet"
                        desc="Upload your resume to get your first ATS score."
                        actionTo="/ats"
                        actionLabel="Analyze resume"
                      />
                    )}
                  </Card>
                </section>

                <section aria-label="Recommended jobs">
                  <Card title="Recommended jobs" sub="Matched against your primary resume">
                    {recommendations.length > 0 ? (
                      <ul className="dashboard__list">
                        {recommendations.map((job) => (
                          <li key={job.jobId}>
                            <Link to="/jobs" className="dashboard__row">
                              <ScoreRing score={job.matchScore} size={52} stroke={6} label="" />
                              <div className="dashboard__row-main">
                                <p className="dashboard__row-title">{job.title}</p>
                                <p className="dashboard__row-sub">
                                  {[job.company, job.location].filter(Boolean).join(" · ")}
                                </p>
                                {job.missingSkills?.length > 0 && (
                                  <div className="dashboard__chips">
                                    {job.missingSkills.slice(0, 3).map((s) => (
                                      <Badge key={s} tone="warning">{s}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        glyph="◎"
                        title="No recommendations yet"
                        desc="Add a resume and browse jobs to get personalized matches."
                        actionTo="/jobs"
                        actionLabel="Browse jobs"
                      />
                    )}
                  </Card>
                </section>
              </div>

              <section aria-label="Quick links">
                <h2 className="dashboard__section-title">Jump back in</h2>
                <div className="dashboard__quick">
                  {QUICK_LINKS.map((q) => (
                    <Link key={q.to} to={q.to} className="quick-link">
                      <span className="quick-link__glyph" aria-hidden="true">{q.glyph}</span>
                      <span className="quick-link__label">{q.label}</span>
                      <span className="quick-link__desc">{q.desc}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Dashboard;
