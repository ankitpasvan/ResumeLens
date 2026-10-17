import SectionHeading from "../ui/SectionHeading";

const STEPS = [
  {
    n: "01",
    title: "Upload your resume",
    desc: "Drop in a PDF. We parse it instantly and keep every version organized.",
  },
  {
    n: "02",
    title: "Get your ATS score",
    desc: "See an explainable breakdown — keywords, skills, format — with fixes that matter.",
  },
  {
    n: "03",
    title: "Match real jobs",
    desc: "Compare your resume against job descriptions and close the skill gaps.",
  },
  {
    n: "04",
    title: "Ace the interview",
    desc: "Practice with role-specific questions and a prep plan built from your background.",
  },
];

const Workflow = () => {
  return (
    <section className="landing-section" id="workflow">
      <SectionHeading
        eyebrow="How it works"
        title="From upload to offer in four steps"
        desc="A simple loop: analyze, improve, match, prepare — then repeat until hired."
      />
      <ol className="landing-steps">
        {STEPS.map((s) => (
          <li className="landing-step" key={s.n}>
            <span className="landing-step__n" aria-hidden="true">{s.n}</span>
            <h3 className="landing-step__title">{s.title}</h3>
            <p className="landing-step__desc">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default Workflow;
