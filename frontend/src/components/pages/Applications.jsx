import { useEffect, useMemo, useState } from "react";
import "../../style/jobs.scss";
import Navbar from "../Navbar";
import { useJobs } from "../../features/jobs/hooks/useJobs";
import { APPLICATION_STATUSES } from "../../features/jobs/services/jobs.api";

const STATUS_LABELS = {
  saved: "Saved",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const nextStatuses = (status) => {
  const order = ["saved", "applied", "assessment", "interview", "offer"];
  if (status === "rejected" || status === "offer") return [];
  const idx = order.indexOf(status);
  const next = idx >= 0 ? order.slice(idx + 1, idx + 2) : [];
  return [...next, "rejected"];
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

const ApplicationCard = ({ application, onMove, onEdit, onDelete }) => {
  const [showHistory, setShowHistory] = useState(false);
  const history = application.statusHistory || [];

  return (
    <article className="app-card">
      <div className="app-card-top">
        <h4>{application.jobTitle}</h4>
        {application.matchScore != null && (
          <span className="score-badge">{application.matchScore}%</span>
        )}
      </div>
      {application.company && <p className="muted small">{application.company}</p>}
      {application.nextStep && (
        <p className="next-step">
          <span className="next-step-label">Next:</span> {application.nextStep}
          {application.nextStepDate && (
            <span className="muted"> · {formatDate(application.nextStepDate)}</span>
          )}
        </p>
      )}
      {application.notes && <p className="app-notes">{application.notes}</p>}

      <div className="app-actions">
        {nextStatuses(application.status).map((s) => (
          <button
            key={s}
            type="button"
            className={`button sm ${s === "rejected" ? "ghost-button" : "primary-button"}`}
            onClick={() => onMove(application, s)}
          >
            → {STATUS_LABELS[s]}
          </button>
        ))}
        <button type="button" className="link-btn" onClick={() => onEdit(application)}>
          Details
        </button>
        <button type="button" className="link-btn danger" onClick={() => onDelete(application)}>
          Delete
        </button>
      </div>

      {history.length > 1 && (
        <button
          type="button"
          className="link-btn history-toggle"
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? "Hide history" : `History (${history.length})`}
        </button>
      )}
      {showHistory && (
        <ul className="history-list">
          {history.map((h, i) => (
            <li key={i}>
              <span className="history-status">{STATUS_LABELS[h.status] || h.status}</span>
              <span className="muted small"> · {formatDate(h.at)}</span>
              {h.note && <p className="muted small">{h.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </article>
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

  useEffect(() => {
    fetchApplications().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  const visible = useMemo(
    () => (filter ? applications.filter((a) => a.status === filter) : applications),
    [applications, filter],
  );

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

  return (
    <div className="jobs-page">
      <Navbar />
      <div className="jobs-container">
        <header className="page-head">
          <div>
            <h1>Application tracker</h1>
            <p className="muted">
              {activeCount} active application{activeCount === 1 ? "" : "s"} in
              your pipeline.
            </p>
          </div>
          <div className="head-actions">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]} ({counts[s] || 0})
                </option>
              ))}
            </select>
          </div>
        </header>

        {error && <p className="banner banner-error">{error}</p>}

        {loading && applications.length === 0 ? (
          <p className="muted">Loading applications…</p>
        ) : applications.length === 0 ? (
          <div className="empty">
            <h3>No applications yet</h3>
            <p className="muted">
              Save a job from the Jobs page or a Job Match result, then start an
              application to track it here.
            </p>
          </div>
        ) : filter ? (
          <div className="pipeline-list">
            {visible.length === 0 ? (
              <p className="muted">Nothing in this stage.</p>
            ) : (
              visible.map((a) => (
                <ApplicationCard
                  key={a._id}
                  application={a}
                  onMove={handleMove}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        ) : (
          <div className="pipeline">
            {APPLICATION_STATUSES.map((status) => {
              const items = applications.filter((a) => a.status === status);
              return (
                <section key={status} className={`pipeline-col col-${status}`}>
                  <header className="pipeline-col-head">
                    <h3>{STATUS_LABELS[status]}</h3>
                    <span className="count">{items.length}</span>
                  </header>
                  <div className="pipeline-col-body">
                    {items.length === 0 ? (
                      <p className="muted small col-empty">—</p>
                    ) : (
                      items.map((a) => (
                        <ApplicationCard
                          key={a._id}
                          application={a}
                          onMove={handleMove}
                          onEdit={setEditing}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <EditNotesModal
          application={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={handleSaveDetails}
        />
      )}
    </div>
  );
};

export default Applications;
