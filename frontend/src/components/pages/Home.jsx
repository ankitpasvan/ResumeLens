import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../../../src/style/home.scss'
import AppLayout from '../layout/AppLayout'
import PageHeader from '../layout/PageHeader'
import { useInterview } from '../interviewhook/useInterview.js'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const HistorySection = () => {
  const { reports, getReports } = useInterview()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getReports()
      .then(() => {
        if (!cancelled) { setLoading(false); setError('') }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false)
          setError(err.message || 'Failed to load interview history.')
        }
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey])

  return (
    <section className="interview-history" aria-label="Recent interview reports">
      <header className="history-head">
        <h2>Recent interviews</h2>
        {reports.length > 0 && (
          <span className="muted small">{reports.length} report{reports.length === 1 ? '' : 's'}</span>
        )}
      </header>

      {loading && (
        <div className="history-loading">
          <span className="spinner" />
          <p className="muted small">Loading history…</p>
        </div>
      )}

      {!loading && error && (
        <div className="history-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button ghost-button"
            onClick={() => setRetryKey((k) => k + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="muted small history-empty">
          No interview reports yet. Generate your first strategy above.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <ul className="history-list">
          {reports.map((r) => {
            const qCount = (r.technicalQuestions?.length || 0) + (r.behavioralQuestions?.length || 0)
            const jdSnippet = (r.jobDescription || '').trim().slice(0, 90)
            return (
              <li key={r._id}>
                <Link to={`/interview/${r._id}`} className="history-row">
                  <div className="history-row-main">
                    <p className="history-row-title">
                      {jdSnippet ? `${jdSnippet}${r.jobDescription.length > 90 ? '…' : ''}` : 'Interview report'}
                    </p>
                    <p className="muted small">
                      {formatDate(r.createdAt)}
                      {qCount > 0 && ` · ${qCount} question${qCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <span className="history-row-open" aria-hidden="true">→</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const { generateReport } = useInterview()

  const [jobDescription, setJobDescription] = useState('')
  const [selfDescription, setSelfDescription] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    setResumeFile(e.target.files?.[0] || null)
  }

  const handleGenerate = async () => {
    setError('')

    if (!jobDescription.trim()) {
      setError('Job description is required.')
      return
    }
    if (!resumeFile && !selfDescription.trim()) {
      setError('Upload a resume PDF or add a self-description.')
      return
    }

    setGenerating(true)
    try {
      const report = await generateReport({
        jobDescription: jobDescription.trim(),
        selfDescription: selfDescription.trim(),
        resumeFile,
      })
      navigate(`/interview/${report._id}`)
    } catch (err) {
      setError(err.message || 'Failed to generate the interview plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AppLayout>
      <div className="home">
      <PageHeader
        glyph="✦"
        title="Interview Prep"
        subtitle="Let our AI analyze the job requirements and your unique profile to build a winning strategy."
      />

      {/* Main Card Container */}
      <div className="card-container">
        <div className="interview-input-group">
          {/* Left Column: Job Description */}
          <div className="left">
            <div className="section-header">
              <div className="title-wrap">
                <span className="icon briefcase-icon">💼</span>
                <h3>Target Job Description</h3>
              </div>
              <span className="badge-required">Required</span>
            </div>

            <div className="textarea-wrapper">
              <textarea
                name="jobDescription"
                id="jobDescription"
                maxLength={5000}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here...&#10;e.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"
              />
              <span className="char-counter">{jobDescription.length} / 5000 chars</span>
            </div>
          </div>

          <div className="vertical-divider" />

          {/* Right Column: User Profile */}
          <div className="right">
            <div className="section-header">
              <div className="title-wrap">
                <span className="icon user-icon">👤</span>
                <h3>Your Profile</h3>
              </div>
            </div>

            {/* Resume Upload Box */}
            <div className="input-group upload-section">
              <label className="field-label">
                Upload Resume <span className="sub-tag">(Best Results)</span>
              </label>

              <label className="file-label" htmlFor="resume">
                <div className="upload-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    <path d="M12 12v6M9 15l3-3 3 3" />
                  </svg>
                </div>
                <p className="upload-text">
                  {resumeFile ? resumeFile.name : 'Click to upload or drag & drop'}
                </p>
                <p className="upload-subtext">PDF (Max 3MB)</p>
              </label>
              <input
                hidden
                ref={fileInputRef}
                type="file"
                id="resume"
                name="resume"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </div>

            <div className="or-divider">
              <span>OR</span>
            </div>

            {/* Quick Self-Description */}
            <div className="input-group">
              <label className="field-label" htmlFor="selfDescription">
                Quick Self-Description
              </label>
              <textarea
                name="selfDescription"
                id="selfDescription"
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
              />
            </div>

            {/* Info Notice Box */}
            <div className="info-banner">
              <span className="info-icon">ⓘ</span>
              <p>
                Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="gen-error" role="alert">
            {error}
          </p>
        )}

        {/* Card Footer */}
        <div className="card-footer">
          <span className="footer-meta">AI-Powered Strategy Generation • Approx 30s</span>
          <button
            className="button primary-button"
            type="button"
            onClick={handleGenerate}
            disabled={generating}
          >
            <span className="btn-sparkle">✦</span>
            {generating ? 'Generating...' : 'Generate My Interview Strategy'}
          </button>
        </div>
      </div>

      <HistorySection />

      {/* Page Footer */}
      <footer className="page-footer">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#help">Help Center</a>
      </footer>
      </div>
    </AppLayout>
  )
}

export default Home
