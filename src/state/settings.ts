import { create } from 'zustand';
import { suggestedVersion } from '../data/catalog';
import { getJson, setJson } from '../storage';

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

const SUPPORTED: UiLang[] = ['en', 'pt-BR', 'es', 'fr', 'de', 'zh-CN', 'ja'];

/** UI language from the browser preferences. Falls back to English when nothing matches. */
export function detectUiLang(langs: readonly string[] = navigator.languages?.length ? navigator.languages : [navigator.language]): UiLang {
  for (const l of langs) {
    const base = l.toLowerCase().split('-')[0];
    const hit = SUPPORTED.find((s) => s.toLowerCase().split('-')[0] === base);
    if (hit) return hit;
  }
  return 'en';
}

const initialLang = detectUiLang();

export const DEFAULTS: Settings = {
  uiLang: initialLang,
  versionId: suggestedVersion(initialLang),
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

const load = (): Settings => ({ ...DEFAULTS, ...getJson<Partial<Settings>>(KEY, {}) });

interface SettingsStore extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Resets only the reading settings. UI language and version stay as they are. */
  resetText: () => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  ...load(),
  set: (key, value) => set({ [key]: value } as Partial<Settings>),
  resetText: () => set(({ uiLang, versionId }) => ({ ...DEFAULTS, uiLang, versionId })),
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
  document.documentElement.lang = useSettings.getState().uiLang;
  dark.addEventListener('change', () => applyTheme(useSettings.getState().theme));
  useSettings.subscribe((s) => {
    applyTheme(s.theme);
    document.documentElement.lang = s.uiLang;
    const { set: _s, resetText: _r, ...data } = s;
    setJson(KEY, data);
  });
}
