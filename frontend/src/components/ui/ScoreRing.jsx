// 2D SVG score ring (no WebGL, no deps). Tone colors the ring:
// emerald ≥ 80, violet ≥ 60, warning ≥ 40, danger below.
const TONE_COLORS = {
  emerald: "#34d399",
  violet: "#a855f7",
  warning: "#fbbf24",
  danger: "#f87171",
};

const toneFor = (score) => {
  if (score >= 80) return "emerald";
  if (score >= 60) return "violet";
  if (score >= 40) return "warning";
  return "danger";
};

const ScoreRing = ({ score = 0, size = 120, stroke = 10, label = "Score", tone }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const resolvedTone = tone || toneFor(clamped);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="ui-score-ring">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${clamped} out of 100`}
      >
        <circle
          className="ui-score-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
        />
        <circle
          className="ui-score-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={TONE_COLORS[resolvedTone]}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <text
          x="50%"
          y="50%"
          dy="0.35em"
          textAnchor="middle"
          fill="#f1f5f9"
          fontSize={size * 0.24}
          fontWeight="800"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
        >
          {clamped}
        </text>
      </svg>
      {label && <span className="ui-score-ring__label">{label}</span>}
    </div>
  );
};

export default ScoreRing;
