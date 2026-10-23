import { create } from 'zustand';

export type Theme = 'auto' | 'light' | 'sepia' | 'dark';
export type FontFamily = 'serif' | 'sans' | 'mono';
export type Margins = 'narrow' | 'medium' | 'wide';
export type Align = 'left' | 'justify';
export type VerseNumbers = 'visible' | 'subtle' | 'hidden';
export type TextMode = 'verses' | 'paragraph';
export type UiLang = 'en' | 'pt-BR' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja';

export interface Settings {
  uiLang: UiLang;
  versionId: string;
  theme: Theme;
  font: FontFamily;
  fontSize: number;
  lineHeight: number;
  margins: Margins;
  align: Align;
  verseNumbers: VerseNumbers;
  textMode: TextMode;
}

export const DEFAULTS: Settings = {
  uiLang: 'pt-BR',
  versionId: 'en_kjv',
  theme: 'auto',
  font: 'serif',
  fontSize: 19,
  lineHeight: 1.7,
  margins: 'medium',
  align: 'left',
  verseNumbers: 'subtle',
  textMode: 'verses',
};

const KEY = 'ob:settings';

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  ...load(),
  set: (key, value) => set({ [key]: value } as Partial<Settings>),
  reset: () => set({ ...DEFAULTS }),
}));

const dark = matchMedia('(prefers-color-scheme: dark)');
const THEME_COLORS = { light: '#faf9f7', sepia: '#f3ead8', dark: '#14161b' } as const;

export function applyTheme(theme: Theme) {
  const resolved = theme === 'auto' ? (dark.matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

export function initSettingsEffects() {
  applyTheme(useSettings.getState().theme);
  dark.addEventListener('change', () => applyTheme(useSettings.getState().theme));
  useSettings.subscribe((s) => {
    applyTheme(s.theme);
    const { set: _s, reset: _r, ...data } = s;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* sem persistência, o app segue funcionando */
    }
  });
}
