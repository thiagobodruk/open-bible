import { useEffect, useMemo, useState } from 'react';
import { loadBook } from './data/bible';
import { BOOKS, type Book } from './data/books';
import { useLibrary } from './state/library';
import { useSettings } from './state/settings';

/** Livros da versão em uso, com os nomes do arquivo da versão. Sem versão instalada, o cânone com nomes em pt-BR. */
export function useBooks(): Book[] {
  const versionId = useSettings((s) => s.versionId);
  const meta = useLibrary((s) => s.installed[versionId]);
  return useMemo(() => {
    if (!meta) return BOOKS;
    return meta.books.map((b) => ({
      id: b.id,
      name: b.name,
      chapters: b.chapters,
      testament: BOOKS.find((x) => x.id === b.id)!.testament,
    }));
  }, [meta]);
}

export function useBookName() {
  const books = useBooks();
  return (id: string) => books.find((b) => b.id === id)?.name ?? BOOKS.find((b) => b.id === id)?.name ?? id;
}

export type ChapterState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; verses: string[] };

/** Texto de um capítulo da versão em uso, lido do IndexedDB. */
export function useChapter(book: string, chapter: number): ChapterState {
  const versionId = useSettings((s) => s.versionId);
  const installed = useLibrary((s) => !!s.installed[versionId]);
  const ready = useLibrary((s) => s.ready);
  const [state, setState] = useState<{ key: string; value: ChapterState }>({ key: '', value: { status: 'loading' } });
  const key = `${versionId}:${book}.${chapter}`;

  useEffect(() => {
    if (!ready) return;
    if (!installed) {
      setState({ key, value: { status: 'missing' } });
      return;
    }
    let live = true;
    loadBook(versionId, book)
      .then((b) => {
        if (!live) return;
        const verses = b?.chapters[chapter - 1];
        setState({ key, value: verses ? { status: 'ready', verses } : { status: 'missing' } });
      })
      .catch(() => live && setState({ key, value: { status: 'missing' } }));
    return () => {
      live = false;
    };
  }, [key, ready, installed, versionId, book, chapter]);

  return state.key === key ? state.value : { status: 'loading' };
}
