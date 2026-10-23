import { create } from 'zustand';
import { VERSIONS } from '../data/library';

interface LibraryStore {
  downloaded: string[];
  downloading: Record<string, number>; // 0..1
  download: (id: string, done?: () => void) => void;
  remove: (id: string) => void;
}

// Simula o download. Na camada lógica isso passa a baixar o JSON da versão e gravar no IndexedDB.
export const useLibrary = create<LibraryStore>((set, get) => ({
  downloaded: ['en_kjv', 'pt_nvi'],
  downloading: {},
  download: (id, done) => {
    if (get().downloading[id] !== undefined || get().downloaded.includes(id)) return;
    set((s) => ({ downloading: { ...s.downloading, [id]: 0 } }));
    const tick = setInterval(() => {
      const p = (get().downloading[id] ?? 0) + 0.12 + Math.random() * 0.1;
      if (p >= 1) {
        clearInterval(tick);
        set((s) => {
          const { [id]: _, ...rest } = s.downloading;
          return { downloading: rest, downloaded: [...s.downloaded, id] };
        });
        done?.();
      } else {
        set((s) => ({ downloading: { ...s.downloading, [id]: p } }));
      }
    }, 140);
  },
  remove: (id) => set((s) => ({ downloaded: s.downloaded.filter((d) => d !== id) })),
}));

export const downloadedBytes = (ids: string[]) =>
  ids.reduce((sum, id) => sum + (VERSIONS.find((v) => v.id === id)?.sizeMb ?? 0), 0);
