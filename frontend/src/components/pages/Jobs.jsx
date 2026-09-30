import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../style/jobs.scss";
import Navbar from "../Navbar";
import { useJobs } from "../../features/jobs/hooks/useJobs";

const JOB_TYPES = ["full-time", "part-time", "contract", "internship", "freelance"];
const WORK_MODES = ["remote", "on-site", "hybrid"];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatSalary = (job) => {
  if (job.salaryMin == null && job.salaryMax == null) return "";
  const cur = job.currency || "INR";
  const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString());
  if (job.salaryMin != null && job.salaryMax != null)
    return `${cur} ${fmt(job.salaryMin)}–${fmt(job.salaryMax)} / yr`;
  const n = job.salaryMin ?? job.salaryMax;
  return `${cur} ${fmt(n)} / yr`;
};

const EMPTY_FORM = {
  title: "",
  company: "",
  location: "",
  jobType: "full-time",
  workMode: "on-site",
  description: "",
  requirements: "",
  skills: "",
  salaryMin: "",
  salaryMax: "",
  currency: "INR",
  status: "open",
};

const JobForm = ({ initial, saving, onSubmit, onCancel }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) return setFormError("Job title is required.");
    if (!form.company.trim()) return setFormError("Company name is required.");
    if (form.description.trim().length < 20)
      return setFormError("Description needs at least 20 characters.");
    const min = form.salaryMin === "" ? undefined : Number(form.salaryMin);
    const max = form.salaryMax === "" ? undefined : Number(form.salaryMax);
    if (min !== undefined && max !== undefined && min > max)
      return setFormError("Minimum salary cannot exceed maximum salary.");
    onSubmit({
      ...form,
      title: form.title.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      requirements: form.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      salaryMin: min,
      salaryMax: max,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{initial ? "Edit job" : "Post a job"}</h2>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="job-form">
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              Job title *
              <input value={form.title} onChange={set("title")} placeholder="Senior Frontend Developer" maxLength={120} />
            </label>
            <label>
              Company *
              <input value={form.company} onChange={set("company")} placeholder="Acme Corp" maxLength={120} />
            </label>
            <label>
              Location
              <input value={form.location} onChange={set("location")} placeholder="Bengaluru, India" maxLength={120} />
            </label>
            <label>
              Currency
              <input value={form.currency} onChange={set("currency")} placeholder="INR" maxLength={6} />
            </label>
            <label>
              Job type
              <select value={form.jobType} onChange={set("jobType")}>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Work mode
              <select value={form.workMode} onChange={set("workMode")}>
                {WORK_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Min salary (annual)
              <input type="number" min="0" value={form.salaryMin} onChange={set("salaryMin")} placeholder="1800000" />
            </label>
            <label>
              Max salary (annual)
              <input type="number" min="0" value={form.salaryMax} onChange={set("salaryMax")} placeholder="2500000" />
            </label>
          </div>
          <label>
            Description *
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={6}
              placeholder="What will this person do? What does success look like?"
            />
          </label>
          <label>
            Requirements <span className="hint">(one per line)</span>
            <textarea
              value={form.requirements}
              onChange={set("requirements")}
              rows={3}
              placeholder={"4+ years of React experience\nStrong TypeScript fundamentals"}
            />
          </label>
          <label>
            Skills <span className="hint">(comma separated)</span>
            <input value={form.skills} onChange={set("skills")} placeholder="React, TypeScript, CSS" />
          </label>
          <label>
            Status
            <select value={form.status} onChange={set("status")}>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="button ghost-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="button primary-button" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Post job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JobCard = ({ job, savedIds, onSave, onEdit, onDelete, onStartApplication }) => {
  const [expanded, setExpanded] = useState(false);
  const isSaved = savedIds.has(String(job._id));
  const salary = formatSalary(job);

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div>
          <h3 className="job-title">{job.title}</h3>
          <p className="muted small">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        {job.status !== "open" && <span className="pill pill-muted">{job.status}</span>}
      </div>

      <div className="chip-row">
        <span className="chip">{job.jobType}</span>
        <span className="chip">{job.workMode}</span>
        {salary && <span className="chip chip-salary">{salary}</span>}
      </div>

      <p className="job-desc">{job.description}</p>

      {expanded && (
        <>
          {job.requirements?.length > 0 && (
            <ul className="req-list">
              {job.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          {job.skills?.length > 0 && (
            <div className="chip-row">
              {job.skills.map((s) => (
                <span key={s} className="chip chip-skill">{s}</span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="job-card-foot">
        <span className="muted small">Posted {formatDate(job.createdAt)}</span>
        <div className="job-actions">
          <button type="button" className="link-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Details"}
          </button>
          {job.isMine ? (
            <>
              <button type="button" className="link-btn" onClick={() => onEdit(job)}>
                Edit
              </button>
              <button type="button" className="link-btn danger" onClick={() => onDelete(job)}>
                Delete
              </button>
            </>
          ) : isSaved ? (
            <button type="button" className="button ghost-button sm" onClick={() => onStartApplication(job)}>
              Start application
            </button>
          ) : (
            <button type="button" className="button ghost-button sm" onClick={() => onSave(job)}>
              Save job
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

const Jobs = () => {
  const {
    jobs,
    savedJobs,
    loading,
    saving,
    error,
    setError,
    fetchJobs,
    addJob,
    editJob,
    removeJob,
    fetchSavedJobs,
    addSavedJob,
    removeSavedJob,
    addApplication,
  } = useJobs();
  const navigate = useNavigate();

  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchJobs().catch(() => {});
    fetchSavedJobs().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setError("");
    fetchJobs({
      ...(query.trim() ? { q: query.trim() } : {}),
      ...(jobType ? { jobType } : {}),
      ...(mineOnly ? { mine: "1" } : {}),
    }).catch(() => {});
  };

  const savedIds = useMemo(
    () => new Set(savedJobs.map((s) => String(s.job || ""))),
    [savedJobs],
  );

  const handleSave = async (job) => {
    try {
      await addSavedJob({ jobId: job._id });
    } catch {
      // Error is already surfaced via the hook.
    }
  };

  const startFromSaved = async (saved) => {
    try {
      await addApplication({ savedJobId: saved._id, status: "applied" });
      navigate("/applications");
    } catch {
      // Error is already surfaced via the hook.
    }
  };

  const startFromJob = async (job) => {
    const saved = savedJobs.find((s) => s.job && String(s.job) === String(job._id));
    if (saved) return startFromSaved(saved);
    try {
      await addApplication({ jobId: job._id, status: "applied" });
      navigate("/applications");
    } catch {
      // Error is already surfaced via the hook.
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}" at ${job.company}?`)) return;
    try {
      await removeJob(job._id);
    } catch {
      // Surfaced via the hook.
    }
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (editing) {
        await editJob(editing._id, payload);
      } else {
        await addJob(payload);
      }
      setShowForm(false);
      setEditing(null);
    } catch {
      // Surfaced via the hook.
    }
  };

  const openEdit = (job) => {
    setEditing(job);
    setShowForm(true);
  };

  const toFormInitial = (job) =>
    job
      ? {
          title: job.title || "",
          company: job.company || "",
          location: job.location || "",
          jobType: job.jobType || "full-time",
          workMode: job.workMode || "on-site",
          description: job.description || "",
          requirements: (job.requirements || []).join("\n"),
          skills: (job.skills || []).join(", "),
          salaryMin: job.salaryMin ?? "",
          salaryMax: job.salaryMax ?? "",
          currency: job.currency || "INR",
          status: job.status || "open",
        }
      : EMPTY_FORM;

  return (
    <div className="jobs-page">
      <Navbar />
      <div className="jobs-container">
        <header className="page-head">
          <div>
            <h1>Jobs</h1>
            <p className="muted">
              Browse open roles, post your own, and save the ones worth pursuing.
            </p>
          </div>
          <div className="head-actions">
            <Link to="/applications" className="button ghost-button">
              Application tracker
            </Link>
            <button
              type="button"
              className="button primary-button"
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              Post a job
            </button>
          </div>
        </header>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === "browse" ? "tab-active" : ""}`}
            onClick={() => setTab("browse")}
          >
            Browse jobs
          </button>
          <button
            type="button"
            className={`tab ${tab === "saved" ? "tab-active" : ""}`}
            onClick={() => setTab("saved")}
          >
            Saved ({savedJobs.length})
          </button>
        </div>

        {error && <p className="banner banner-error">{error}</p>}

        {tab === "browse" && (
          <>
            <div className="filters">
              <input
                className="filter-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search title, company or skill…"
              />
              <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                <option value="">All types</option>
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <label className="check">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(e) => setMineOnly(e.target.checked)}
                />
                My postings
              </label>
              <button type="button" className="button ghost-button" onClick={applyFilters}>
                Apply
              </button>
            </div>

            {loading && jobs.length === 0 ? (
              <p className="muted">Loading jobs…</p>
            ) : jobs.length === 0 ? (
              <div className="empty">
                <h3>No jobs found</h3>
                <p className="muted">
                  Try a different search, or be the first to post a role.
                </p>
              </div>
            ) : (
              <div className="job-list">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    savedIds={savedIds}
                    onSave={handleSave}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onStartApplication={startFromJob}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "saved" && (
          <>
            {savedJobs.length === 0 ? (
              <div className="empty">
                <h3>No saved jobs yet</h3>
                <p className="muted">
                  Save interesting roles from the browse tab or from a Job Match
                  result, then start an application when you are ready.
                </p>
              </div>
            ) : (
              <div className="job-list">
                {savedJobs.map((s) => (
                  <article key={s._id} className="job-card">
                    <div className="job-card-top">
                      <div>
                        <h3 className="job-title">{s.jobTitle}</h3>
                        {s.company && <p className="muted small">{s.company}</p>}
                      </div>
                      <span className="muted small">Saved {formatDate(s.createdAt)}</span>
                    </div>
                    {s.description && (
                      <p className="job-desc">
                        {s.description.length > 300
                          ? `${s.description.slice(0, 300)}…`
                          : s.description}
                      </p>
                    )}
                    {s.notes && <p className="muted small">Note: {s.notes}</p>}
                    <div className="job-card-foot">
                      <span />
                      <div className="job-actions">
                        <button
                          type="button"
                          className="button primary-button sm"
                          onClick={() => startFromSaved(s)}
                        >
                          Start application
                        </button>
                        <button
                          type="button"
                          className="link-btn danger"
                          onClick={() => removeSavedJob(s._id).catch(() => {})}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <JobForm
          initial={toFormInitial(editing)}
          saving={saving}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default Jobs;
