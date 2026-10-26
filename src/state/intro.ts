import { create } from 'zustand';
import { getItem, setItem } from '../storage';

/** A abertura inicial (entrar ou pular, e as telas de apresentação) aparece uma única vez. */
const KEY = 'ob:intro';

// Sem armazenamento a abertura não aparece, para não repetir a cada visita.
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
