import { create } from 'zustand';

export type LangCode = 'ko' | 'en';

interface LangState {
  lang: LangCode;
  setLang: (code: LangCode) => void;
}

const stored = localStorage.getItem('dmap-lang') as LangCode | null;
const browserLang = navigator.language;
const initial: LangCode = stored || (browserLang.startsWith('ko') ? 'ko' : 'en');

export const useLangStore = create<LangState>((set) => ({
  lang: initial,
  setLang: (code) => {
    localStorage.setItem('dmap-lang', code);
    set({ lang: code });
  },
}));
