import { createContext, useContext } from "react";

// Theme state for the whole app. The initial value is read from
// document.documentElement.dataset.theme, which the inline script in
// index.html sets before first paint from localStorage / the OS
// preference — so React never has to guess and there is no flash.
// This file exports only the context object and the useTheme hook
// (no component), so it satisfies the react-refresh
// only-export-components rule without any suppression. The
// ThemeProvider component lives in ./ThemeProvider.jsx and imports
// this exact same context object — there is only one ThemeContext.
export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
