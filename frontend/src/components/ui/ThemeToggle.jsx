import { useTheme } from "../../features/theme/theme.context";

// Light/Dark switch. Shows a moon in light mode (click → dark) and a sun
// in dark mode (click → light). Styles live in style/ui.scss (.theme-toggle)
// so the button looks right in the app header, the landing nav and on the
// auth pages (extra className can position it, e.g. "theme-toggle--floating").
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
    </button>
  );
};

export default ThemeToggle;
