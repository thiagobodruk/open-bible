import { create } from 'zustand';
import { getItem, setItem } from '../storage';

/** The initial intro (sign in or skip, and the presentation screens) shows only once. */
const KEY = 'ob:intro';

// Without storage the intro does not show, to avoid repeating on every visit.
const seen = () => getItem(KEY, '1') === '1';

interface IntroStore {
  done: boolean;
  finish: () => void;
}

export const useIntro = create<IntroStore>((set) => ({
  done: seen(),
  finish: () => {
    setItem(KEY, '1');
    set({ done: true });
  },
}));
