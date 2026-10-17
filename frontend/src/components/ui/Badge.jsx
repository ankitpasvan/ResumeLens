// Small status pill. Tones: default | violet | emerald | warning | danger.
const Badge = ({ tone = "default", className = "", children, ...rest }) => {
  const toneCls = tone === "default" ? "" : ` ui-badge--${tone}`;
  return (
    <span className={`ui-badge${toneCls} ${className}`.trim()} {...rest}>
      {children}
    </span>
  );
};

export default Badge;
