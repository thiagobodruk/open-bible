// Estatísticas de uso anônimas (Google Analytics pelo Firebase). Só funcionam com o consentimento de quem usa.
// Os eventos dizem apenas que algo foi usado. Nunca levam texto de versículo, notas nem perguntas à IA.
import { create } from 'zustand';
import { firebaseConfig } from './firebase-config';
import { useLibrary } from './state/library';
import { useSettings } from './state/settings';
import { useUI } from './state/ui';

export type Consent = 'granted' | 'denied' | null;
export type Feature = 'highlight' | 'note' | 'listen' | 'compare' | 'ask' | 'search';

const KEY = 'ob:analytics';
const SCREENS: Record<string, string> = { '': 'reader', '/study': 'study', '/library': 'library', '/settings': 'settings', '/privacy': 'privacy' };

export const analyticsAvailable = () => firebaseConfig !== null;

function savedConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

interface AnalyticsStore {
  consent: Consent;
  setConsent: (granted: boolean) => void;
}

export const useAnalytics = create<AnalyticsStore>((set) => ({
  consent: analyticsAvailable() ? savedConsent() : 'denied',
  setConsent: (granted) => {
    const consent: Consent = granted ? 'granted' : 'denied';
    try {
      localStorage.setItem(KEY, consent);
    } catch {
      /* sem persistência, a escolha vale até fechar o app */
    }
    set({ consent });
  },
}));

type Params = Record<string, string | number>;
interface Loaded {
  an: import('firebase/analytics').Analytics;
  mod: typeof import('firebase/analytics');
}

let loading: Promise<Loaded | null> | null = null;

/** Carrega o Analytics só depois do consentimento. Sem coleta de sinais do Google para anúncios. */
function load(): Promise<Loaded | null> {
  loading ??= (async () => {
    const [{ getApps, initializeApp }, mod] = await Promise.all([import('firebase/app'), import('firebase/analytics')]);
    if (!(await mod.isSupported())) return null;
    const app = getApps()[0] ?? initializeApp(firebaseConfig!);
    const an = mod.initializeAnalytics(app, { config: { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false } });
    return { an, mod };
  })().catch(() => {
    loading = null;
    return null;
  });
  return loading;
}

/** Registra um evento. Sem consentimento, não faz nada. */
export function track(name: string, params?: Params) {
  if (useAnalytics.getState().consent !== 'granted') return;
  void load().then((l) => {
    // O consentimento pode ter sido retirado enquanto o Analytics carregava.
    if (l && useAnalytics.getState().consent === 'granted') l.mod.logEvent(l.an, name, params);
  });
}

export const trackFeature = (feature: Feature) => track('feature_use', { feature });

let started = false;

/** Liga os observadores de telas, versões e instalação e aplica a escolha atual. */
export function initAnalytics() {
  if (started || !analyticsAvailable()) return;
  started = true;

  const apply = (consent: Consent) => {
    if (consent === 'granted') {
      void load().then((l) => l?.mod.setAnalyticsCollectionEnabled(l.an, true));
      track('version_use', { version: useSettings.getState().versionId });
      screen();
    } else if (loading) void loading.then((l) => l?.mod.setAnalyticsCollectionEnabled(l.an, false));
  };
  const screen = () => track('screen_view', { screen_name: SCREENS[location.hash.replace(/^#/, '')] ?? 'reader' });

  addEventListener('hashchange', screen);
  addEventListener('appinstalled', () => track('app_install'));
  useSettings.subscribe((s, prev) => {
    if (s.versionId !== prev.versionId) track('version_use', { version: s.versionId });
  });
  useUI.subscribe((s, prev) => {
    if (s.sheet !== prev.sheet && (s.sheet === 'compare' || s.sheet === 'search')) trackFeature(s.sheet);
  });
  useLibrary.subscribe((s, prev) => {
    if (!prev.ready) return;
    for (const id of Object.keys(s.installed)) if (!prev.installed[id]) track('version_download', { version: id });
  });
  let last = useAnalytics.getState().consent;
  useAnalytics.subscribe((s) => {
    if (s.consent === last) return;
    last = s.consent;
    apply(s.consent);
  });
  apply(last);
}
