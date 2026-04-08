import { useState, useEffect, useCallback } from 'react';

export const useTheme = (initialTheme = 'dark') => {
  const [theme, setThemeState] = useState(initialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme, setTheme: setThemeState, toggleTheme, isDark: theme === 'dark', mounted };
};