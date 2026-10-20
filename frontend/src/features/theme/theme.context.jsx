import { createContext, useContext, useEffect, useState } from "react";

// Theme state for the whole app. The initial value is read from
// document.documentElement.dataset.theme, which the inline script in
// index.html sets before first paint from localStorage / the OS
// preference — so React never has to guess and there is no flash.
const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

const STORAGE_KEY = "resumelens-theme";

const initialTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

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

export const useTheme = () => useContext(ThemeContext);
