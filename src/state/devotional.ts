import { create } from 'zustand';
import { getItem, setItem } from '../storage';
import { dateStamp, loadPack, packLang, type DevotionalPack } from '../data/devotional';
import { useSettings } from './settings';

/** "1" once the person answered the invitation to turn the daily devotional on, in the onboarding or in the sheet. */
const ASKED = 'ob:devotionalAsked';
/** The day (YYYY-MM-DD) the devotional last opened by itself, so it shows once a day. */
const SHOWN = 'ob:devotionalShown';

/** The progress bar stays at least this long, so it does not flash when the pack is already close. */
const MIN_LOADING = 300;

interface DevotionalStore {
  status: 'idle' | 'loading' | 'ready' | 'offline' | 'error';
  /** Download progress, from 0 to 1. */
  progress: number;
  pack: DevotionalPack | null;
  asked: boolean;
  /** Loads the pack of the interface language, or the English one when the language has none. */
  load: () => Promise<void>;
  markAsked: () => void;
  /** Turns the daily devotional on. It was just shown or chosen, so it waits for tomorrow to open by itself. */
  enable: () => void;
}

let current = 0;

export const useDevotional = create<DevotionalStore>((set, get) => ({
  status: 'idle',
  progress: 0,
  pack: null,
  asked: getItem(ASKED) === '1',
  load: async () => {
    const lang = packLang(useSettings.getState().uiLang);
    if (get().pack?.lang === lang) return set({ status: 'ready' });
    const id = ++current;
    const started = Date.now();
    set({ status: 'loading', progress: 0 });
    try {
      const pack = await loadPack(lang, (progress) => id === current && set({ progress }));
      const wait = MIN_LOADING - (Date.now() - started);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      if (id === current) set({ pack, status: 'ready', progress: 1 });
    } catch {
      if (id === current) set({ status: navigator.onLine === false ? 'offline' : 'error' });
    }
  },
  markAsked: () => {
    setItem(ASKED, '1');
    set({ asked: true });
  },
  enable: () => {
    useSettings.getState().set('devotional', true);
    get().markAsked();
    markShownToday();
  },
}));

export const shownToday = () => getItem(SHOWN) === dateStamp(new Date());
export const markShownToday = () => setItem(SHOWN, dateStamp(new Date()));
