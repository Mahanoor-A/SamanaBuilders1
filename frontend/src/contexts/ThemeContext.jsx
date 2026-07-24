import { createContext, useContext, useState, useEffect } from 'react';
import themes from '../themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('sabana-theme');
    return themes.find(t => t.id === saved) || themes[0];
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary.DEFAULT);
    root.style.setProperty('--color-primary-light', theme.colors.primary.light);
    root.style.setProperty('--color-primary-lighter', theme.colors.primary.lighter);
    root.style.setProperty('--color-bg', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text.DEFAULT);
    root.style.setProperty('--color-text-muted', theme.colors.text.muted);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-accent-success', theme.colors.accent.success);
    root.style.setProperty('--color-accent-warning', theme.colors.accent.warning);
    root.style.setProperty('--color-accent-danger', theme.colors.accent.danger);
    root.style.setProperty('--gradient-primary', theme.gradients.primary);
    root.style.setProperty('--gradient-hero', theme.gradients.hero);
    root.style.setProperty('--gradient-surface', theme.gradients.surface);
    localStorage.setItem('sabana-theme', theme.id);
  }, [theme]);

  const setTheme = (id) => {
    const found = themes.find(t => t.id === id);
    if (found) setThemeState(found);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
