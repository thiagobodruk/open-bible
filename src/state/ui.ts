import { create } from 'zustand';

export type SheetName = 'menu' | 'navigator' | 'text' | 'install' | 'feedback' | 'listen' | 'note' | 'compare' | 'xrefs' | 'search' | null;

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
let timer: ReturnType<typeof setTimeout> | undefined;

export const useUI = create<UIStore>((set) => ({
  sheet: null,
  toast: null,
  homeUrl: false,
  setHomeUrl: (homeUrl) => set({ homeUrl }),
  open: (sheet) => set({ sheet }),
  close: () => set({ sheet: null }),
  notify: (message, action) => {
    clearTimeout(timer);
    set({ toast: { id: ++n, message, action } });
    timer = setTimeout(() => set({ toast: null }), action ? 8000 : 2600);
  },
  dismissToast: () => set({ toast: null }),
}));
