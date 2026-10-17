// Consistent section header for landing/marketing sections.
const SectionHeading = ({ eyebrow, title, desc, align = "center", className = "", ...rest }) => {
  return (
    <div
      className={`ui-section-head${align === "left" ? " ui-section-head--left" : ""} ${className}`.trim()}
      {...rest}
    >
      {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
      <h2 className="ui-section-title">{title}</h2>
      {desc && <p className="ui-section-desc">{desc}</p>}
    </div>
  );
};

export default SectionHeading;
