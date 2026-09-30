import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import "../../style/ats.scss";
import Navbar from "../Navbar";
import AtsResult from "../ats/AtsResult";
import { useAts } from "../../features/ats/hooks/useAts";

const MAX_FILE_BYTES = 3 * 1024 * 1024; // matches backend multer limit

const AtsAnalyzer = () => {
  const { analyzing, analysis, error, analyze, setError, setAnalysis } = useAts();

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleAnalyze = async () => {
    setAnalysis(null);
    try {
      await analyze({ resumeFile, resumeText, jobDescription });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // error is already in state via the hook
    }
  };

  const canAnalyze = !analyzing && (resumeFile || resumeText.trim().length > 0);

  return (
    <main className="ats-page">
      <Navbar />

      <div className="ats-container">
        <header className="ats-header">
          <h1>
            ATS Resume <span className="gradient-text">Analyzer</span>
          </h1>
          <p>
            Upload your resume and get a transparent, explainable ATS score —
            plus AI feedback on strengths, weaknesses and missing keywords.
          </p>
          <Link to="/ats/history" className="ats-link">
            View past analyses →
          </Link>
        </header>

        <section className="ats-card ats-input-card">
          <div className="ats-input-grid">
            {/* Resume input */}
            <div className="ats-input-col">
              <h3>Your resume</h3>

              <div
                className={`dropzone ${dragActive ? "dropzone-active" : ""} ${resumeFile ? "dropzone-filled" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fileInputRef.current?.click();
                }}
              >
                <input
                  ref={fileInputRef}
                  hidden
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {resumeFile ? (
                  <div className="file-chosen">
                    <span className="file-icon">📄</span>
                    <div>
                      <p className="file-name">{resumeFile.name}</p>
                      <p className="muted small">
                        {(resumeFile.size / 1024).toFixed(0)} KB — click to replace
                      </p>
                    </div>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="dropzone-icon">⬆</span>
                    <p className="dropzone-text">Click to upload or drag &amp; drop</p>
                    <p className="muted small">PDF only · max 3MB</p>
                  </>
                )}
              </div>

              <div className="or-divider">
                <span>OR paste resume text</span>
              </div>

              <textarea
                className="ats-textarea"
                rows={6}
                placeholder="Paste your resume text here if you don't have a PDF handy..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            {/* Job description input */}
            <div className="ats-input-col">
              <h3>
                Target job description{" "}
                <span className="optional-badge">optional</span>
              </h3>
              <textarea
                className="ats-textarea ats-textarea-tall"
                placeholder="Paste the job description here for keyword matching, missing-skill detection and sharper feedback..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <p className="muted small">
                Without a job description you still get the full resume-quality
                score; keyword matching is simply skipped.
              </p>
            </div>
          </div>

          {error && <p className="ats-error">{error}</p>}

          <div className="ats-actions">
            <button
              type="button"
              className="button primary-button ats-analyze-btn"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
            >
              {analyzing ? (
                <>
                  <span className="spinner" /> Analyzing...
                </>
              ) : (
                <>
                  <span className="btn-sparkle">✦</span> Analyze my resume
                </>
              )}
            </button>
            {!resumeFile && !resumeText.trim() && (
              <span className="muted small">Add a PDF or paste resume text to begin.</span>
            )}
          </div>
        </section>

        {analyzing && !analysis && (
          <section className="ats-card ats-loading-card">
            <span className="spinner spinner-lg" />
            <p>Scoring your resume and generating AI feedback…</p>
            <p className="muted small">This usually takes 10–30 seconds.</p>
          </section>
        )}

        {analysis && <AtsResult analysis={analysis} />}
      </div>
    </main>
  );
};

export default AtsAnalyzer;
