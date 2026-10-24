import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage';

export type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  const stored = readStorage(STORAGE_KEYS.theme);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    // L'impression / l'export PDF se fait toujours en thème clair
    const before = () => root.classList.remove('dark');
    const after = () => root.classList.toggle('dark', theme === 'dark');
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      writeStorage(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
