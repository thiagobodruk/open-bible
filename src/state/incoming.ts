import { create } from 'zustand';
import { parseReadPath, type ReadLink } from '../link';
import { useSettings } from './settings';
import { useStudy } from './study';

interface IncomingStore {
  /** Leitura pedida pelo endereço da página, até ser aplicada ou dispensada. */
  incoming: ReadLink | null;
  clear: () => void;
}

export const useIncoming = create<IncomingStore>((set) => ({
  incoming: parseReadPath(location.pathname),
  clear: () => set({ incoming: null }),
}));

/** Abre o livro e o capítulo do link na versão do link. Só vale com a versão instalada. */
export function applyIncoming() {
  const { incoming, clear } = useIncoming.getState();
  if (!incoming) return;
  useSettings.getState().set('versionId', incoming.versionId);
  useStudy.getState().goTo(incoming.book, incoming.chapter, incoming.verses?.from, incoming.verses?.to);
  clear();
}
