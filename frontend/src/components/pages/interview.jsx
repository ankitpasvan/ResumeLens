import { useState } from 'react'
import '../../style/interview.scss'
import { useInterview } from '../interviewhook/useInterview.js'
import AppLayout from '../layout/AppLayout'
import PageHeader from '../layout/PageHeader'

const SECTIONS = [
  { id: 'technical', label: 'Technical questions' },
  { id: 'behavioral', label: 'Behavioral questions' },
  { id: 'roadmap', label: 'Road Map' },
]

const QuestionAccordion = ({ item, index, answerLabel }) => {
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
          {item.difficulty && (
            <div className="q-accordion__block">
              <span className="q-accordion__tag intention-tag">Difficulty</span>
              <p>{item.difficulty}</p>
            </div>
          )}
          <div className="q-accordion__block">
            <span className="q-accordion__tag answer-tag">{answerLabel}</span>
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.body}</p>
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
    {Array.isArray(plan.tasks) ? (
      <ul className="roadmap-card__tasks">
        {plan.tasks.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    ) : (
      <p className="roadmap-card__task">{plan.tasks}</p>
    )}
  </article>
)

const Interview = () => {
  const [activeTab, setActiveTab] = useState('technical')
  const { report, loading, getResumePdf } = useInterview()

  if (loading || !report) {
    return (
      <AppLayout>
        <div className="interview-loading">
          <div className="spinner" />
          <p>Loading your customized interview plan...</p>
        </div>
      </AppLayout>
    )
  }

  const technicalQuestions = report.technicalQuestions || []
  const behavioralQuestions = report.behavioralQuestions || []
  const preparationPlan = report.preparationPlan || []
  const skillGaps = report.skillGaps || []

  return (
    <AppLayout>
      <div className="interview-page">
        <PageHeader
          glyph="✦"
          title="Interview"
          subtitle="Your customized interview plan."
        />

        <div className="interview-viewport">
        {/* Report header: match score + PDF download */}
        <div className="report-head pg-panel">
          <div className="report-head__main">
            <div className="report-score" aria-hidden="true">
              {report.matchScore ?? '–'}
            </div>
            <div>
              <h2 className="report-head__title">Your Interview Plan</h2>
              <p className="report-head__sub">
                Match score: {report.matchScore ?? '–'}/100
              </p>
            </div>
          </div>
          <button
            type="button"
            className="pg-btn pg-btn--primary"
            onClick={() => getResumePdf(report._id)}
          >
            Download resume PDF
          </button>
        </div>

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
                      <QuestionAccordion
                        key={idx}
                        item={{ ...q, body: q.expectedAnswer }}
                        index={idx}
                        answerLabel="How to answer"
                      />
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
                      <QuestionAccordion
                        key={idx}
                        item={{ ...q, body: q.tip }}
                        index={idx}
                        answerLabel="Answer tip"
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="content-panel">
                  <header className="content-panel__head">
                    <h3>Road Map</h3>
                    <span className="count-pill">{preparationPlan.length} Days</span>
                  </header>
                  <div className="roadmap-stack">
                    {preparationPlan.map((plan, idx) => (
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
                {skillGaps.length > 0 ? (
                  skillGaps.map((gap, idx) => (
                    <span
                      key={idx}
                      className={`skill-chip skill-chip--${gap.severity || 'low'}`}
                      title={gap.suggestion || ''}
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
      </div>
    </AppLayout>
  )
}

export default Interview
