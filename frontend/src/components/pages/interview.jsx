import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'

const SECTIONS = [
  { id: 'technical', label: 'Technical questions' },
  { id: 'behavioral', label: 'Behavioral questions' },
  { id: 'roadmap', label: 'Road Map' },
]

const QuestionAccordion = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article className={`q-accordion ${isOpen ? 'q-accordion--expanded' : ''}`}>
      <header className="q-accordion__header" onClick={() => setIsOpen((prev) => !prev)}>
        <span className="q-accordion__badge">Q{index + 1}</span>
        <h4 className="q-accordion__title">{item.question}</h4>
        <span className="q-accordion__toggle">{isOpen ? '−' : '+'}</span>
      </header>

      {isOpen && (
        <div className="q-accordion__body">
          <div className="q-accordion__block">
            <span className="q-accordion__tag intention-tag">Intention</span>
            <p>{item.intention}</p>
          </div>
          <div className="q-accordion__block">
            <span className="q-accordion__tag answer-tag">Model Answer</span>
            <p>{item.answer}</p>
          </div>
        </div>
      )}
    </article>
  )
}

const RoadMapCard = ({ plan }) => (
  <article className="roadmap-card">
    <div className="roadmap-card__meta">
      <span className="roadmap-card__day">Day {plan.day}</span>
      <h4 className="roadmap-card__focus">{plan.focus}</h4>
    </div>
    <p className="roadmap-card__task">{plan.tasks}</p>
  </article>
)

const Interview = () => {
  const [activeTab, setActiveTab] = useState('technical')
  const { report, getReportById, loading } = useInterview()
  const { interviewId } = useParams()

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId)
    }
  }, [interviewId])

  if (loading || !report) {
    return (
      <main className="interview-loading">
        <div className="spinner" />
        <p>Loading your customized interview plan...</p>
      </main>
    )
  }

  const technicalQuestions = report.technicalQuestions || []
  const behavioralQuestions = report.behavioralQuestions || []
  const preparationPlans = report.preparationPlans || []
  const skillgaps = report.skillgaps || []

  return (
    <div className="interview-viewport">
      <div className="interview-board">
        {/* ── Left Column: Nav Items ── */}
        <nav className="interview-board__left">
          <div className="nav-button-group">
            {SECTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`nav-button ${activeTab === tab.id ? 'nav-button--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="interview-board__divider" />

        {/* ── Middle Column: Main Dynamic Content ── */}
        <section className="interview-board__center">
          <div className="content-container">
            {activeTab === 'technical' && (
              <div className="content-panel">
                <header className="content-panel__head">
                  <h3>Technical Questions</h3>
                  <span className="count-pill">{technicalQuestions.length}</span>
                </header>
                <div className="accordion-stack">
                  {technicalQuestions.map((q, idx) => (
                    <QuestionAccordion key={idx} item={q} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'behavioral' && (
              <div className="content-panel">
                <header className="content-panel__head">
                  <h3>Behavioral Questions</h3>
                  <span className="count-pill">{behavioralQuestions.length}</span>
                </header>
                <div className="accordion-stack">
                  {behavioralQuestions.map((q, idx) => (
                    <QuestionAccordion key={idx} item={q} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="content-panel">
                <header className="content-panel__head">
                  <h3>Road Map</h3>
                  <span className="count-pill">{preparationPlans.length} Days</span>
                </header>
                <div className="roadmap-stack">
                  {preparationPlans.map((plan, idx) => (
                    <RoadMapCard key={plan.day || idx} plan={plan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="interview-board__divider" />

        {/* ── Right Column: Skill Gaps ── */}
        <aside className="interview-board__right">
          <div className="skill-section">
            <h4 className="skill-section__heading">Skill Gaps</h4>
            <div className="skill-section__chips">
              {skillgaps.length > 0 ? (
                skillgaps.map((gap, idx) => (
                  <span
                    key={idx}
                    className={`skill-chip skill-chip--${gap.severity || 'low'}`}
                  >
                    {gap.skill}
                  </span>
                ))
              ) : (
                <p className="no-gaps">No skill gaps found</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Interview