import { Link } from "react-router-dom";

// Dependency-free button. Renders a <Link> when `to` is given, else <button>.
// Variants: primary | secondary | ghost | danger. Sizes: sm | md | lg.
const Button = ({
  to,
  href,
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) => {
  const cls = `ui-btn ui-btn--${variant} ui-btn--${size}${block ? " ui-btn--block" : ""} ${className}`.trim();
  const content = (
    <>
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled || loading} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} aria-disabled={disabled || loading} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
};

export default Button;
