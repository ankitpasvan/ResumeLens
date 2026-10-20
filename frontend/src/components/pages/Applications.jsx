import { useEffect, useMemo, useState } from "react";
import "../../style/jobs.scss";
import AppLayout from "../layout/AppLayout";
import PageHeader from "../layout/PageHeader";
import { APPLICATION_STATUSES } from "../../features/jobs/services/jobs.api";
import { useJobs } from "../../features/jobs/hooks/useJobs";

const STATUS_LABELS = {
  saved: "Saved",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

// Badge colour per status, mapped from the real status strings.
const STATUS_BADGES = {
  saved: "pg-badge--slate",
  applied: "pg-badge--green",
  assessment: "pg-badge--amber",
  interview: "pg-badge--violet",
  offer: "pg-badge--green",
  rejected: "pg-badge--red",
};

const PAGE_SIZE = 8;

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const EditNotesModal = ({ application, saving, onClose, onSave }) => {
  const [notes, setNotes] = useState(application.notes || "");
  const [nextStep, setNextStep] = useState(application.nextStep || "");
  const [nextStepDate, setNextStepDate] = useState(
    application.nextStepDate
      ? new Date(application.nextStepDate).toISOString().slice(0, 10)
      : "",
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Application details</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form
          className="job-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(application._id, {
              notes,
              nextStep,
              nextStepDate: nextStepDate || undefined,
            });
          }}
        >
          <p className="muted small">
            {application.jobTitle}
            {application.company ? ` · ${application.company}` : ""}
          </p>
          <label>
            Next step
            <input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g. Technical round with the hiring manager"
              maxLength={200}
            />
          </label>
          <label>
            Next step date
            <input
              type="date"
              value={nextStepDate}
              onChange={(e) => setNextStepDate(e.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Contacts, talking points, things to follow up on…"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="button ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary-button" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplicationRow = ({ application, onMove, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const history = application.statusHistory || [];
  const hasDetails =
    Boolean(application.nextStep) || Boolean(application.notes) || history.length > 1;
  const initial = (application.company || application.jobTitle || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <tr>
        <td>
          <div className="pg-cell-main">
            <span className="pg-cell-avatar" aria-hidden="true">
              {initial}
            </span>
            <div>
              <div className="pg-cell-title">{application.jobTitle}</div>
              {application.matchScore != null ? (
                <div className="pg-cell-sub">{application.matchScore}% match score</div>
              ) : application.nextStep ? (
                <div className="pg-cell-sub">Next: {application.nextStep}</div>
              ) : null}
            </div>
          </div>
        </td>
        <td>
          <span className="pg-cell-muted">{application.company || "—"}</span>
        </td>
        <td>
          <span className={`pg-badge ${STATUS_BADGES[application.status] || "pg-badge--slate"}`}>
            {STATUS_LABELS[application.status] || application.status}
          </span>
        </td>
        <td>
          <span className="pg-cell-muted">{formatDate(application.createdAt)}</span>
        </td>
        <td>
          <div className="pg-actions">
            <select
              className="pg-select pg-actions__select"
              value={application.status}
              onChange={(e) => {
                if (e.target.value !== application.status) {
                  onMove(application, e.target.value);
                }
              }}
              aria-label={`Change status for ${application.jobTitle}`}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="pg-btn pg-btn--ghost pg-btn--sm"
              onClick={() => onEdit(application)}
            >
              Details
            </button>
            {hasDetails && (
              <button
                type="button"
                className="pg-btn pg-btn--ghost pg-btn--sm"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded
                  ? "Hide"
                  : history.length > 1
                    ? `Timeline (${history.length})`
                    : "More"}
              </button>
            )}
            <button
              type="button"
              className="pg-btn pg-btn--danger pg-btn--sm"
              onClick={() => onDelete(application)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="app-detail-row">
          <td colSpan={5}>
            <div className="app-detail">
              {application.nextStep && (
                <p className="app-detail__next">
                  <span className="app-detail__next-label">Next step:</span>{" "}
                  {application.nextStep}
                  {application.nextStepDate && (
                    <span className="pg-cell-muted">
                      {" "}
                      · {formatDate(application.nextStepDate)}
                    </span>
                  )}
                </p>
              )}
              {application.notes && <p className="app-detail__notes">{application.notes}</p>}
              {history.length > 1 && (
                <ul className="app-history">
                  {history.map((h, i) => (
                    <li key={i}>
                      <span className="app-history__status">
                        {STATUS_LABELS[h.status] || h.status}
                      </span>
                      <span className="pg-cell-muted"> · {formatDate(h.at)}</span>
                      {h.note && <p className="app-history__note">{h.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const Applications = () => {
  const {
    applications,
    loading,
    saving,
    error,
    setError,
    fetchApplications,
    moveApplication,
    editApplication,
    removeApplication,
  } = useJobs();

  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchApplications().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = applications.filter((a) => {
      if (filter && a.status !== filter) return false;
      if (!q) return true;
      return (
        (a.jobTitle || "").toLowerCase().includes(q) ||
        (a.company || "").toLowerCase().includes(q)
      );
    });
    const time = (a) => (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    return [...list].sort((x, y) => (sort === "oldest" ? time(x) - time(y) : time(y) - time(x)));
  }, [applications, filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleMove = async (application, status) => {
    setError("");
    try {
      await moveApplication(application._id, status);
    } catch {
      // Surfaced via the hook.
    }
  };

  const handleDelete = async (application) => {
    if (!window.confirm(`Remove the application for "${application.jobTitle}"?`)) return;
    try {
      await removeApplication(application._id);
    } catch {
      // Surfaced via the hook.
    }
  };

  const handleSaveDetails = async (id, payload) => {
    try {
      await editApplication(id, payload);
      setEditing(null);
    } catch {
      // Surfaced via the hook.
    }
  };

  const activeCount = applications.filter(
    (a) => a.status !== "rejected" && a.status !== "offer",
  ).length;

  const inProgressCount = (counts.assessment || 0) + (counts.interview || 0);

  return (
    <AppLayout>
      <div className="jobs-page">
        <PageHeader
          glyph="✈"
          title="Applications"
          subtitle="Track your job applications and stay organized. Never miss a follow-up!"
        />

        {error && (
          <p className="pg-alert pg-alert--error" role="alert">
            {error}
          </p>
        )}

        <section className="pg-stats" aria-label="Application summary">
          <div className="pg-stat">
            <span className="pg-stat__icon" aria-hidden="true">
              ✈
            </span>
            <span className="pg-stat__body">
              <span className="pg-stat__value">{applications.length}</span>
              <span className="pg-stat__label">Total Applications</span>
              <span className="pg-stat__sub">{activeCount} active in pipeline</span>
            </span>
          </div>
          <div className="pg-stat">
            <span className="pg-stat__icon pg-stat__icon--green" aria-hidden="true">
              ✓
            </span>
            <span className="pg-stat__body">
              <span className="pg-stat__value">{counts.applied || 0}</span>
              <span className="pg-stat__label">Applied</span>
              <span className="pg-stat__sub">{counts.saved || 0} saved for later</span>
            </span>
          </div>
          <div className="pg-stat">
            <span className="pg-stat__icon pg-stat__icon--amber" aria-hidden="true">
              ◷
            </span>
            <span className="pg-stat__body">
              <span className="pg-stat__value">{inProgressCount}</span>
              <span className="pg-stat__label">In Progress</span>
              <span className="pg-stat__sub">
                Assessment {counts.assessment || 0} · Interview {counts.interview || 0}
              </span>
            </span>
          </div>
          <div className="pg-stat">
            <span className="pg-stat__icon pg-stat__icon--red" aria-hidden="true">
              ✕
            </span>
            <span className="pg-stat__body">
              <span className="pg-stat__value">{counts.rejected || 0}</span>
              <span className="pg-stat__label">Rejected</span>
              <span className="pg-stat__sub">{counts.offer || 0} offers received</span>
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
              placeholder="Search by job title or company…"
              aria-label="Search applications"
            />
          </label>
          <select
            className="pg-select"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]} ({counts[s] || 0})
              </option>
            ))}
          </select>
          <select
            className="pg-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Sort applications"
          >
            <option value="latest">Sort by: Latest</option>
            <option value="oldest">Sort by: Oldest</option>
          </select>
        </div>

        {loading && applications.length === 0 ? (
          <div className="pg-loading" role="status">
            <p>Loading applications…</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty">
            <h3>No applications yet</h3>
            <p className="muted">
              Save a job from the Jobs page or a Job Match result, then start an
              application to track it here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <h3>Nothing matches</h3>
            <p className="muted">
              No applications match the current search and filters.
            </p>
          </div>
        ) : (
          <>
            <div className="pg-table-wrap">
              <table className="pg-table">
                <thead>
                  <tr>
                    <th scope="col">Job Title</th>
                    <th scope="col">Company</th>
                    <th scope="col">Status</th>
                    <th scope="col">Applied On</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a) => (
                    <ApplicationRow
                      key={a._id}
                      application={a}
                      onMove={handleMove}
                      onEdit={setEditing}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pg-pagination">
              <span className="pg-pagination__info">
                Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
                applications
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
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`pg-page-btn ${n === safePage ? "pg-page-btn--active" : ""}`}
                    onClick={() => setPage(n)}
                    aria-current={n === safePage ? "page" : undefined}
                  >
                    {n}
                  </button>
                ))}
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

        {editing && (
          <EditNotesModal
            application={editing}
            saving={saving}
            onClose={() => setEditing(null)}
            onSave={handleSaveDetails}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Applications;
