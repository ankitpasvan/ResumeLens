// CSS-only aurora background (no WebGL, no deps). The nebula is a static
// layered gradient; a slow drift animation runs on top unless the user
// prefers reduced motion — then everything is static.
const AuroraBackground = () => {
  return (
    <div className="landing-aurora" aria-hidden="true">
      <div className="landing-aurora__base" />
      <div className="landing-aurora__drift" />
      <div className="landing-aurora__grid" />
    </div>
  );
};

export default AuroraBackground;
