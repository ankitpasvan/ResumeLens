import React, { useState } from 'react'
import '../../../src/style/home.scss'

const Home = () => {
  const [jobDescription, setJobDescription] = useState('')

  return (
    <main className="home">
      {/* Page Header */}
      <header className="page-header">
        <h1>
          Create Your Custom <span className="gradient-text">Interview Plan</span>
        </h1>
        <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
        <div className="header-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        </div>
      </header>

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
                <p className="upload-text">Click to upload or drag & drop</p>
                <p className="upload-subtext">PDF or DOCX (Max 5MB)</p>
              </label>
              <input hidden type="file" id="resume" name="resume" accept=".pdf,.docx" />
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

        {/* Card Footer */}
        <div className="card-footer">
          <span className="footer-meta">AI-Powered Strategy Generation • Approx 30s</span>
          <button className="button primary-button" type="button">
            <span className="btn-sparkle">✦</span>
            Generate My Interview Strategy
          </button>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="page-footer">
        <a href="#privacy">Privacy Policy</a>
        <a href="#terms">Terms of Service</a>
        <a href="#help">Help Center</a>
      </footer>
    </main>
  )
}

export default Home