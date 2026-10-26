// Anonymous usage statistics (Google Analytics via Firebase). They only run with the user's consent.
// Events only say that something was used. They never carry verse text, notes or AI questions.
import { create } from 'zustand';
import { firebaseConfig } from './firebase-config';
import { useLibrary } from './state/library';
import { useSettings } from './state/settings';
import { useUI } from './state/ui';
import { getItem, setItem } from './storage';

export type Consent = 'granted' | 'denied' | null;
export type Feature =
  | 'highlight' | 'note' | 'listen' | 'compare' | 'ask' | 'search' | 'xref' | 'copy' | 'share'
  | 'study_filter' | 'study_search' | 'study_sort' | 'reading_settings';

const KEY = 'ob:analytics';
const SCREENS: Record<string, string> = { '': 'reader', '/study': 'study', '/settings': 'settings', '/terms': 'terms', '/privacy': 'privacy' };

const READING_KEYS = ['theme', 'font', 'fontSize', 'lineHeight', 'margins', 'align', 'verseNumbers', 'textMode'] as const;

export const analyticsAvailable = () => firebaseConfig !== null;

function savedConsent(): Consent {
  const v = getItem(KEY);
  return v === 'granted' || v === 'denied' ? v : null;
}

interface AnalyticsStore {
  consent: Consent;
  setConsent: (granted: boolean) => void;
}

export const useAnalytics = create<AnalyticsStore>((set) => ({
  consent: analyticsAvailable() ? savedConsent() : 'denied',
  setConsent: (granted) => {
    const consent: Consent = granted ? 'granted' : 'denied';
    setItem(KEY, consent);
    set({ consent });
  },
}));

type Params = Record<string, string | number>;
interface Loaded {
  an: import('firebase/analytics').Analytics;
  mod: typeof import('firebase/analytics');
}

let loading: Promise<Loaded | null> | null = null;

/** Loads Analytics only after consent. No Google signals collection for ads. */
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

/** Records an event. Without consent, does nothing. */
export function track(name: string, params?: Params) {
  if (useAnalytics.getState().consent !== 'granted') return;
  void load().then((l) => {
    // O consentimento pode ter sido retirado enquanto o Analytics carregava.
    if (l && useAnalytics.getState().consent === 'granted') l.mod.logEvent(l.an, name, params);
  });
}

export const trackFeature = (feature: Feature) => track('feature_use', { feature });

let started = false;

/** Wires up the screen, version and install observers and applies the current choice. */
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
    // Reading settings only: version and interface language have their own events or metrics.
    if (READING_KEYS.some((k) => s[k] !== prev[k])) trackFeature('reading_settings');
  });
  useUI.subscribe((s, prev) => {
    if (s.sheet === prev.sheet) return;
    if (s.sheet === 'compare' || s.sheet === 'search') trackFeature(s.sheet);
    else if (s.sheet === 'xrefs') trackFeature('xref');
    else if (s.sheet === 'library') track('screen_view', { screen_name: 'library' });
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
