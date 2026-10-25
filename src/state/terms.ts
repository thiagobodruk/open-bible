import { create } from 'zustand';
import { TERMS_VERSION } from '../terms';

/** Aceite dos termos e da política: guardado no aparelho e, quando há conta, também em `users/{uid}.terms`. */
const KEY = 'ob:terms';

export interface Acceptance {
  version: string;
  at: number;
}

export function savedAcceptance(): Acceptance | null {
  try {
    const a = JSON.parse(localStorage.getItem(KEY) || 'null');
    return a && typeof a.version === 'string' && Number.isFinite(a.at) ? a : null;
  } catch {
    return null;
  }
}

interface TermsStore {
  /** Caixa de aceite da abertura inicial. Começa marcada. */
  checked: boolean;
  setChecked: (v: boolean) => void;
  /** Registra o aceite de agora. */
  accept: () => void;
}

export const useTerms = create<TermsStore>((set) => ({
  checked: true,
  setChecked: (checked) => set({ checked }),
  accept: () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: TERMS_VERSION, at: Date.now() } satisfies Acceptance));
    } catch {
      /* sem persistência, o aceite vale nesta sessão e é pedido de novo na próxima abertura */
    }
  },
}));
