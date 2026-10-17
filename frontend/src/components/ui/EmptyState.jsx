import Button from "./Button";

// Friendly empty state. `glyph` is a simple text/unicode symbol (no emoji art).
const EmptyState = ({ glyph = "○", title, desc, actionTo, actionLabel }) => {
  return (
    <div className="ui-empty">
      <div className="ui-empty__glyph" aria-hidden="true">{glyph}</div>
      <h3 className="ui-empty__title">{title}</h3>
      {desc && <p className="ui-empty__desc">{desc}</p>}
      {actionTo && actionLabel && (
        <Button to={actionTo} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
