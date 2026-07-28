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
    // Set hex color vars (for gradients, borders, etc.)
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

    // Set RGB vars for Tailwind opacity support (hex -> rgb conversion)
    root.style.setProperty('--color-primary-rgb', hexToRgb(theme.colors.primary.DEFAULT));
    root.style.setProperty('--color-primary-light-rgb', hexToRgb(theme.colors.primary.light));
    root.style.setProperty('--color-primary-lighter-rgb', hexToRgb(theme.colors.primary.lighter));
    root.style.setProperty('--color-bg-rgb', hexToRgb(theme.colors.background));
    root.style.setProperty('--color-surface-rgb', hexToRgb(theme.colors.surface));
    root.style.setProperty('--color-text-rgb', hexToRgb(theme.colors.text.DEFAULT));
    root.style.setProperty('--color-text-muted-rgb', hexToRgb(theme.colors.text.muted));
    root.style.setProperty('--color-border-rgb', hexToRgb(theme.colors.border));
    root.style.setProperty('--color-accent-success-rgb', hexToRgb(theme.colors.accent.success));
    root.style.setProperty('--color-accent-warning-rgb', hexToRgb(theme.colors.accent.warning));
    root.style.setProperty('--color-accent-danger-rgb', hexToRgb(theme.colors.accent.danger));

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

/** Convert hex color to space-separated RGB values (e.g. "#1e3a5f" -> "30 58 95") */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}