import { create } from 'zustand';
import { TERMS_VERSION } from '../terms';
import { useAnalytics } from '../analytics';
import { getJson, setJson } from '../storage';

/** Aceite dos termos e da política: guardado no aparelho e, quando há conta, também em `users/{uid}.terms`. */
const KEY = 'ob:terms';

export interface Acceptance {
  version: string;
  at: number;
}

export function savedAcceptance(): Acceptance | null {
  const a = getJson<{ version?: unknown; at?: unknown } | null>(KEY, null);
  return a && typeof a.version === 'string' && Number.isFinite(a.at) ? (a as Acceptance) : null;
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
    // Aceitar os termos inclui as estatísticas de uso. Quem já escolheu desligar continua desligado.
    if (useAnalytics.getState().consent === null) useAnalytics.getState().setConsent(true);
    // Sem armazenamento o aceite vale nesta sessão e é pedido de novo na próxima abertura.
    setJson(KEY, { version: TERMS_VERSION, at: Date.now() } satisfies Acceptance);
  },
}));
