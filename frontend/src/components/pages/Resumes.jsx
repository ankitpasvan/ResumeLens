import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/resumes.scss";
import Navbar from "../Navbar";
import { useResumes } from "../../features/resumes/hooks/useResumes";

const MAX_FILE_BYTES = 3 * 1024 * 1024; // matches backend multer limit
const PREVIEW_CHARS = 1200;

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ResumeCard = ({
  resume,
  onAnalyze,
  onMakePrimary,
  onDelete,
  onPreview,
  previewText,
  previewOpen,
  busy,
}) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <article className={`resume-card ${resume.isPrimary ? "resume-card-primary" : ""}`}>
      <div className="resume-card-head">
        <div>
          <h3 className="resume-name">{resume.name}</h3>
          <p className="muted small">Added {formatDate(resume.createdAt)}</p>
        </div>
        <div className="resume-badges">
          {resume.isPrimary && <span className="badge badge-primary">Primary</span>}
          <span className="badge">{resume.source === "upload" ? "PDF" : "Pasted"}</span>
        </div>
      </div>

      {previewOpen && (
        <pre className="resume-preview">
          {previewText ? previewText.slice(0, PREVIEW_CHARS) : "Loading…"}
          {previewText && previewText.length > PREVIEW_CHARS && "…"}
        </pre>
      )}

      <div className="resume-card-actions">
        <button type="button" className="button primary-button" disabled={busy} onClick={onAnalyze}>
          Analyze in ATS
        </button>
        <button type="button" className="button ghost-button" onClick={() => onPreview(resume._id)}>
          {previewOpen ? "Hide text" : "Preview"}
        </button>
        {!resume.isPrimary && (
          <button type="button" className="button ghost-button" disabled={busy} onClick={onMakePrimary}>
            Set as primary
          </button>
        )}
        {confirming ? (
          <span className="delete-confirm">
            <button
              type="button"
              className="button danger-button"
              disabled={busy}
              onClick={() => { setConfirming(false); onDelete(); }}
            >
              Confirm
            </button>
            <button type="button" className="button ghost-button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="button ghost-button danger-text" onClick={() => setConfirming(true)}>
            Delete
          </button>
        )}
      </div>
    </article>
  );
};

const Resumes = () => {
  const navigate = useNavigate();
  const {
    resumes, loading, saving, error, setError,
    fetchResumes, saveResume, makePrimary, removeResume, fetchResumeText,
  } = useResumes();

  const [mode, setMode] = useState("upload");
  const [name, setName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [previewCache, setPreviewCache] = useState({});
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResumes().catch(() => {});
  }, [fetchResumes]);

  const pickFile = (file) => {
    setError("");
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF resume.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Resume is too large — maximum 3MB.");
      return;
    }
    setResumeFile(file);
  };

  const canSave = !saving && (mode === "upload" ? !!resumeFile : resumeText.trim().length > 0);

  const handleSave = async () => {
    try {
      await saveResume(mode === "upload" ? { name, resumeFile } : { name, resumeText });
      setName("");
      setResumeFile(null);
      setResumeText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch { /* error is already in state via the hook */ }
  };

  const handleAnalyze = async (id) => {
    setBusyId(id);
    try {
      const text = await fetchResumeText(id);
      navigate("/ats", { state: { resumeText: text } });
    } finally {
      setBusyId(null);
    }
  };

  const handlePreview = async (id) => {
    if (previewId === id) { setPreviewId(null); return; }
    setPreviewId(id);
    if (!previewCache[id]) {
      try {
        const text = await fetchResumeText(id);
        setPreviewCache((prev) => ({ ...prev, [id]: text }));
      } catch {
        setPreviewId(null);
      }
    }
  };

  const handleMakePrimary = async (id) => {
    setBusyId(id);
    try { await makePrimary(id); } finally { setBusyId(null); }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await removeResume(id);
      if (previewId === id) setPreviewId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="resumes-page">
      <Navbar />
      <div className="resumes-container">
        <header className="resumes-header">
          <div>
            <h1>Resumes</h1>
            <p className="muted">
              Store your resumes once, then reuse them for ATS analysis, job matching and interview prep.
            </p>
          </div>
          {resumes.length > 0 && (
            <span className="muted small">
              {resumes.length} saved{resumes.some((r) => r.isPrimary) ? " · 1 primary" : ""}
            </span>
          )}
        </header>

        <section className="resumes-card">
          <div className="resumes-tabs">
            <button type="button" className={`tab ${mode === "upload" ? "tab-active" : ""}`} onClick={() => setMode("upload")}>
              Upload PDF
            </button>
            <button type="button" className={`tab ${mode === "paste" ? "tab-active" : ""}`} onClick={() => setMode("paste")}>
              Paste text
            </button>
          </div>

          <label className="field-label" htmlFor="resume-name">Resume name</label>
          <input
            id="resume-name"
            className="resumes-input"
            type="text"
            maxLength={80}
            placeholder="e.g. Backend developer — 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {mode === "upload" ? (
            <div
              className={`dropzone ${dragActive ? "dropzone-active" : ""} ${resumeFile ? "dropzone-filled" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); pickFile(e.dataTransfer.files?.[0]); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
            >
              <input ref={fileInputRef} hidden type="file" accept=".pdf,application/pdf"
                onChange={(e) => pickFile(e.target.files?.[0])} />
              {resumeFile ? (
                <div className="file-chosen">
                  <span className="file-icon">📄</span>
                  <div>
                    <p className="file-name">{resumeFile.name}</p>
                    <p className="muted small">{(resumeFile.size / 1024).toFixed(0)} KB — click to replace</p>
                  </div>
                  <button type="button" className="file-remove"
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    aria-label="Remove file">✕</button>
                </div>
              ) : (
                <>
                  <span className="dropzone-icon">⬆</span>
                  <p className="dropzone-text">Click to upload or drag &amp; drop</p>
                  <p className="muted small">PDF only · max 3MB</p>
                </>
              )}
            </div>
          ) : (
            <textarea
              className="resumes-textarea"
              rows={8}
              placeholder="Paste your full resume text here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          )}

          {error && <p className="resumes-error">{error}</p>}

          <div className="resumes-actions">
            <button type="button" className="button primary-button" disabled={!canSave} onClick={handleSave}>
              {saving ? (<><span className="spinner" /> Saving…</>) : ("Save resume")}
            </button>
            {!canSave && !saving && (
              <span className="muted small">
                {mode === "upload" ? "Choose a PDF to save." : "Paste your resume text to save."}
              </span>
            )}
          </div>
        </section>

        <section className="resumes-list-section">
          <h2>Saved resumes</h2>
          {loading ? (
            <div className="resumes-loading">
              <span className="spinner spinner-lg" />
              <p className="muted">Loading resumes…</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="resumes-empty">
              <p className="resumes-empty-title">No resumes yet</p>
              <p className="muted small">
                Upload a PDF or paste your resume text above. Your first resume becomes the primary one automatically.
              </p>
            </div>
          ) : (
            <div className="resumes-grid">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume._id}
                  resume={resume}
                  busy={busyId === resume._id}
                  previewOpen={previewId === resume._id}
                  previewText={previewCache[resume._id]}
                  onAnalyze={() => handleAnalyze(resume._id)}
                  onPreview={handlePreview}
                  onMakePrimary={() => handleMakePrimary(resume._id)}
                  onDelete={() => handleDelete(resume._id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resumes;
