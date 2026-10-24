import { create } from 'zustand';

export type SheetName = 'menu' | 'navigator' | 'text' | 'install' | 'feedback' | 'listen' | 'note' | 'compare' | 'xrefs' | 'ask' | 'search' | null;

interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface UIStore {
  sheet: SheetName;
  toast: Toast | null;
  /** Enquanto verdadeiro, o endereço da página fica na raiz do app em vez de apontar para o capítulo. */
  homeUrl: boolean;
  setHomeUrl: (on: boolean) => void;
  open: (s: Exclude<SheetName, null>) => void;
  close: () => void;
  notify: (message: string, action?: Toast['action']) => void;
  dismissToast: () => void;
}

let n = 0;
/** Verdadeiro enquanto há uma entrada de histórico empurrada pelo sheet aberto: o Voltar do sistema fecha o sheet em vez de sair da tela. */
let pushed = false;
/** close() agendou o back(); um open() logo em seguida reaproveita a entrada em vez de empurrar outra. */
let backPending = false;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useUI = create<UIStore>((set) => ({
  sheet: null,
  toast: null,
  homeUrl: false,
  setHomeUrl: (homeUrl) => set({ homeUrl }),
  open: (sheet) => {
    if (backPending) {
      backPending = false;
      pushed = true;
    } else if (!pushed) {
      history.pushState({ ob: 'sheet' }, '');
      pushed = true;
    }
    set({ sheet });
  },
  close: () => {
    const wasPushed = pushed;
    pushed = false;
    set({ sheet: null });
    // Quem fecha o sheet costuma navegar logo depois (close(); go(rota)). Por isso o back() espera esse trecho síncrono
    // e só desfaz a entrada se ela ainda é a atual; se a rota mudou, a navegação vale e não há o que voltar.
    if (wasPushed) {
      backPending = true;
      queueMicrotask(() => {
        if (!backPending) return;
        backPending = false;
        if (history.state?.ob === 'sheet') history.back();
      });
    }
  },
  notify: (message, action) => {
    clearTimeout(timer);
    set({ toast: { id: ++n, message, action } });
    timer = setTimeout(() => set({ toast: null }), action ? 8000 : 2600);
  },
  dismissToast: () => set({ toast: null }),
}));

addEventListener('popstate', () => {
  if (useUI.getState().sheet) {
    pushed = false;
    useUI.setState({ sheet: null });
  } else if (history.state?.ob === 'sheet') {
    // Entrada de sheet que ficou para trás (a rota mudou com o sheet aberto): pula.
    history.back();
  }
});
