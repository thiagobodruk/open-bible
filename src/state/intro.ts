import { create } from 'zustand';

/** A abertura inicial (entrar ou pular, e as telas de apresentação) aparece uma única vez. */
const KEY = 'ob:intro';

function seen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
}

interface IntroStore {
  done: boolean;
  finish: () => void;
}

export const useIntro = create<IntroStore>((set) => ({
  done: seen(),
  finish: () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* sem persistência, a abertura volta na próxima visita */
    }
    set({ done: true });
  },
}));
