import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../style/dashboard.scss";
import AppLayout from "../layout/AppLayout";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  getDashboardStats,
  getRecommendations,
} from "../../features/dashboard/services/dashboard.api";
import Spinner from "../ui/Spinner";
import ScoreRing from "../ui/ScoreRing";
import EmptyState from "../ui/EmptyState";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(iso);
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

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
    return () => { cancelled = true; };
  }, [retryKey]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    setRetryKey((k) => k + 1);
  };

  const firstName = user?.username?.split(" ")[0] || "there";
  const avgScore = stats?.analyses?.avgScore ?? 0;
  const recentAnalyses = stats?.analyses?.recent || [];

  const activities = [];
  recentAnalyses.slice(0, 3).forEach((a) => {
    activities.push({
      glyph: "▤",
      title: "Resume analyzed",
      desc: `Your resume scored ${a.score}/100`,
      time: timeAgo(a.createdAt),
      to: `/ats/${a.id}`,
    });
  });
  recommendations.slice(0, 2).forEach((job) => {
    activities.push({
      glyph: "◎",
      title: "Job matched",
      desc: `New job match: ${job.title}`,
      time: "Recently",
      to: "/match",
      state: { jobId: job.jobId },
    });
  });

  const nextSteps = [];
  if ((stats?.resumes?.total ?? 0) === 0) {
    nextSteps.push({
      title: "Upload your resume",
      desc: "Add your resume to unlock ATS scoring and job matching.",
      to: "/resumes",
    });
  }
  if ((stats?.analyses?.total ?? 0) === 0) {
    nextSteps.push({
      title: "Run your first ATS analysis",
      desc: "See how your resume scores against applicant tracking systems.",
      to: "/ats",
    });
  }
  if (recommendations.length > 0) {
    nextSteps.push({
      title: "Review matched jobs",
      desc: `${recommendations.length} job${recommendations.length > 1 ? "s" : ""} matched to your profile.`,
      to: "/jobs",
    });
  }
  if ((stats?.interviews?.total ?? 0) === 0) {
    nextSteps.push({
      title: "Practice an interview",
      desc: "Generate AI interview questions from a job description.",
      to: "/interview-prep",
    });
  }

  const metricCards = [
    {
      glyph: "◉",
      label: "Resume Score",
      value: avgScore > 0 ? `${avgScore}` : "—",
      suffix: avgScore > 0 ? "/ 100" : "",
      sub: stats?.analyses?.total
        ? `${stats.analyses.total} ${stats.analyses.total === 1 ? "analysis" : "analyses"}`
        : "No analyses yet",
      to: "/ats/history",
    },
    {
      glyph: "◎",
      label: "Jobs Matched",
      value: `${stats?.matches?.total ?? 0}`,
      suffix: "",
      sub:
        stats?.matches?.best != null && stats.matches.total > 0
          ? `Best match ${stats.matches.best}%`
          : "Run a match to see scores",
      to: "/match",
    },
    {
      glyph: "✦",
      label: "Interviews Practiced",
      value: `${stats?.interviews?.total ?? 0}`,
      suffix: "",
      sub: "Mock interview sessions",
      to: "/interview-prep",
    },
    {
      glyph: "☰",
      label: "Applications",
      value: `${stats?.applications?.total ?? 0}`,
      suffix: "",
      sub: "Tracked in pipeline",
      to: "/applications",
    },
  ];

  return (
    <AppLayout>
      <div className="dash">
        {loading && (
          <div className="dash__loading" role="status" aria-label="Loading dashboard">
            <Spinner label="Loading dashboard…" />
            <p>Loading your dashboard…</p>
          </div>
        )}

        {!loading && error && (
          <div className="dash__error" role="alert">
            <p>{error}</p>
            <button type="button" className="dash__retry" onClick={handleRetry}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="dash-hero">
              <div className="dash-hero__text">
                <p className="dash-hero__eyebrow">
                  <span aria-hidden="true">✦</span> {getGreeting()}, {firstName}
                </p>
                <h2 className="dash-hero__title">
                  Your career, smarter
                  <br />
                  with ResumeLens
                </h2>
                <p className="dash-hero__desc">
                  Analyze your resume, find better opportunities, prepare for
                  interviews and take the next step in your career.
                </p>
                <Link to="/ats" className="dash-hero__cta">
                  Analyze a resume <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="dash-hero__visual" aria-hidden="true">
                {avgScore > 0 ? (
                  <div className="dash-hero__score">
                    <ScoreRing score={avgScore} size={120} stroke={10} />
                    <span className="dash-hero__score-label">Avg ATS Score</span>
                  </div>
                ) : (
                  <div className="dash-hero__score dash-hero__score--empty">
                    <span className="dash-hero__score-glyph">◉</span>
                    <span className="dash-hero__score-label">
                      Run your first analysis
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="dash-metrics" aria-label="Key metrics">
              {metricCards.map((m) => (
                <Link key={m.label} to={m.to} className="metric-card">
                  <span className="metric-card__glyph" aria-hidden="true">
                    {m.glyph}
                  </span>
                  <span className="metric-card__body">
                    <span className="metric-card__label">{m.label}</span>
                    <span className="metric-card__value">
                      {m.value}
                      {m.suffix && (
                        <span className="metric-card__suffix">{m.suffix}</span>
                      )}
                    </span>
                    <span className="metric-card__sub">{m.sub}</span>
                  </span>
                </Link>
              ))}
            </section>

            <div className="dash-grid">
              <section className="dash-panel" aria-label="Resume health">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title">
                    <span aria-hidden="true">◉</span> Resume Health
                  </h3>
                  {avgScore > 0 && (
                    <span className="dash-badge dash-badge--good">
                      <span className="dash-badge__dot" aria-hidden="true" />
                      Good
                    </span>
                  )}
                </div>
                {recentAnalyses.length > 0 ? (
                  <>
                    <div className="dash-health">
                      <ScoreRing
                        score={recentAnalyses[0].score}
                        size={110}
                        stroke={10}
                        label="ATS Score"
                      />
                      <div className="dash-health__meta">
                        <p className="dash-health__label">Latest analysis</p>
                        <p className="dash-health__date">
                          {formatDate(recentAnalyses[0].createdAt)}
                        </p>
                        <Link
                          to={`/ats/${recentAnalyses[0].id}`}
                          className="dash-health__link"
                        >
                          View full report →
                        </Link>
                      </div>
                    </div>
                    {recentAnalyses.length > 1 && (
                      <ul className="dash-mini-list">
                        {recentAnalyses.slice(1, 4).map((a) => (
                          <li key={a.id}>
                            <Link to={`/ats/${a.id}`} className="dash-mini-row">
                              <ScoreRing score={a.score} size={36} stroke={4} label="" />
                              <span>Score {a.score}/100</span>
                              <span className="dash-mini-row__date">
                                {formatDate(a.createdAt)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <EmptyState
                    glyph="◉"
                    title="No analyses yet"
                    desc="Upload your resume to get your first ATS score and health breakdown."
                    actionTo="/ats"
                    actionLabel="Analyze resume"
                  />
                )}
              </section>

              <section className="dash-panel" aria-label="Recommended next steps">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title">
                    <span aria-hidden="true">⚡</span> Recommended Next Steps
                  </h3>
                </div>
                <p className="dash-panel__sub">
                  Focus on these to improve your chances.
                </p>
                {nextSteps.length > 0 ? (
                  <ol className="dash-steps">
                    {nextSteps.map((step, i) => (
                      <li key={step.title}>
                        <Link to={step.to} className="dash-step">
                          <span className="dash-step__num" aria-hidden="true">
                            {i + 1}
                          </span>
                          <span className="dash-step__body">
                            <span className="dash-step__title">{step.title}</span>
                            <span className="dash-step__desc">{step.desc}</span>
                          </span>
                          <span className="dash-step__arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="dash-panel__empty">
                    You&apos;re all caught up. Keep applying and practicing!
                  </p>
                )}
              </section>

              <section className="dash-panel" aria-label="Recent activity">
                <div className="dash-panel__head">
                  <h3 className="dash-panel__title">
                    <span aria-hidden="true">◷</span> Recent Activity
                  </h3>
                  <Link to="/ats/history" className="dash-panel__link">
                    View all
                  </Link>
                </div>
                {activities.length > 0 ? (
                  <ul className="dash-activity">
                    {activities.map((a, i) => (
                      <li key={`${a.title}-${i}`} className="dash-activity__item">
                        <span className="dash-activity__dot" aria-hidden="true" />
                        <span className="dash-activity__glyph" aria-hidden="true">
                          {a.glyph}
                        </span>
                        <span className="dash-activity__body">
                          <Link to={a.to} state={a.state} className="dash-activity__title">
                            {a.title}
                          </Link>
                          <span className="dash-activity__desc">{a.desc}</span>
                        </span>
                        <span className="dash-activity__time">{a.time}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    glyph="◷"
                    title="No activity yet"
                    desc="Your recent analyses and matches will appear here."
                    actionTo="/ats"
                    actionLabel="Get started"
                  />
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
