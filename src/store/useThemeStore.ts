import { create } from 'zustand';

const STORAGE_KEY = 'd20-dashboard-theme';

function loadPersisted(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark') return true;
    if (v === 'light') return false;
  } catch { /* ignore */ }
  return true;
}

interface ThemeState {
  dark: boolean;
  themeVersion: number;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: loadPersisted(),
  themeVersion: 0,
  toggle: () => {
    const next = !get().dark;
    try { localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light'); } catch { /* ignore */ }
    set({ dark: next, themeVersion: Date.now() });
  },
  setDark: (dark) => {
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ }
    set({ dark, themeVersion: Date.now() });
  },
}));
