// Shared page header for authenticated pages: icon chip + title + subtitle,
// with an optional action element on the right (buttons/links passed as
// children). Matches the header blocks in the reference designs.
const PageHeader = ({ glyph, title, subtitle, children }) => {
  return (
    <div className="page-header">
      <div className="page-header__main">
        {glyph && (
          <span className="page-header__icon" aria-hidden="true">
            {glyph}
          </span>
        )}
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  );
};

export default PageHeader;
