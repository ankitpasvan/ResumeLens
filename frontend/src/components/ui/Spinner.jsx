// Inline loading spinner. `label` is announced to screen readers.
const Spinner = ({ label = "Loading…", className = "" }) => {
  return (
    <span className={`ui-spinner ${className}`.trim()} role="status" aria-label={label} />
  );
};

export default Spinner;
