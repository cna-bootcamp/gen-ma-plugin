import { useLangStore } from '../stores/langStore.js';
import type { LangCode } from '../stores/langStore.js';
import type { Translations } from './types.js';
import ko from './ko.js';
import en from './en.js';

export type { Translations };

export interface Language {
  code: LangCode;
  label: string;
  translations: Translations;
}

export const LANGUAGES: Language[] = [
  { code: 'ko', label: '한국어', translations: ko },
  { code: 'en', label: 'English', translations: en },
];

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? `{{${key}}}`));
}

export function useT() {
  const lang = useLangStore((s) => s.lang);
  const entry = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const translations = entry.translations;

  function t(key: keyof Translations, params?: Record<string, string | number>): string {
    const value = translations[key];
    return params ? interpolate(value, params) : value;
  }

  return t;
}
