/**
 * Accès localStorage protégé (navigation privée, stockage bloqué…).
 * Seules deux clés sont utilisées, comme indiqué dans les mentions légales.
 */
export const STORAGE_KEYS = {
  theme: 'elecguide:theme',
  welcomeSeen: 'elecguide:welcome-seen',
} as const;

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : on ignore */
  }
}
