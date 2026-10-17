// Glass panel wrapper. Use `flat` for a solid panel without blur.
const Card = ({ title, sub, flat = false, className = "", children, ...rest }) => {
  return (
    <div className={`ui-card${flat ? " ui-card--flat" : ""} ${className}`.trim()} {...rest}>
      {title && <h3 className="ui-card__title">{title}</h3>}
      {sub && <p className="ui-card__sub">{sub}</p>}
      {children}
    </div>
  );
};

export default Card;
