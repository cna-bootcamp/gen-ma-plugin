import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const stored = localStorage.getItem('dmap-theme') as Theme | null;
const initial: Theme = stored || 'dark';

// Apply immediately to avoid flash
document.documentElement.classList.toggle('dark', initial === 'dark');

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    localStorage.setItem('dmap-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));
