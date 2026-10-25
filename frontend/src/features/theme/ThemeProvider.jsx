import { useEffect, useState } from "react";
import { ThemeContext } from "./theme.context.jsx";

const STORAGE_KEY = "resumelens-theme";

const initialTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

// ThemeProvider component, moved verbatim out of theme.context.jsx so
// that no file exports both a component and a hook (react-refresh
// only-export-components rule). Behaviour is unchanged: it reads the
// pre-paint theme from documentElement.dataset.theme, writes it back
// on every change, and persists it to localStorage under the same key.
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode etc.) — theme still applies
      // for this session, it just will not persist.
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
