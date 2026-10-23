import { create } from 'zustand';
import { BOOKS, bookIndex } from '../data/books';

export type HlColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
export const HL_COLORS: HlColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];

export const vkey = (book: string, chapter: number, verse: number) => `${book}.${chapter}.${verse}`;

export interface Highlight {
  book: string;
  chapter: number;
  verse: number;
  color: HlColor;
  text: string;
  createdAt: number;
}

export interface Note {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  text: string;
  excerpt: string;
  createdAt: number;
}

const day = 86_400_000;
const now = Date.now();

const seedHighlights: Highlight[] = [
  { book: 'gn', chapter: 1, verse: 1, color: 'yellow', text: 'In the beginning God created the heaven and the earth.', createdAt: now - 6 * day },
  { book: 'gn', chapter: 1, verse: 3, color: 'blue', text: 'And God said, Let there be light: and there was light.', createdAt: now - 6 * day },
  { book: 'gn', chapter: 1, verse: 27, color: 'green', text: 'So God created man in his own image, in the image of God created he him; male and female created he them.', createdAt: now - 5 * day },
  { book: 'sl', chapter: 23, verse: 1, color: 'pink', text: 'The LORD is my shepherd; I shall not want.', createdAt: now - 3 * day },
  { book: 'jo', chapter: 3, verse: 16, color: 'orange', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', createdAt: now - 2 * day },
  { book: 'rm', chapter: 8, verse: 28, color: 'yellow', text: 'Texto de exemplo para Romanos 8:28, usado só para mostrar o agrupamento por livro.', createdAt: now - day },
];

const seedNotes: Note[] = [
  { id: 'n1', book: 'gn', chapter: 1, verseStart: 3, verseEnd: 3, text: 'A palavra vem antes da luz. Voltar a este ponto no estudo sobre criação.', excerpt: 'And God said, Let there be light: and there was light.', createdAt: now - 6 * day },
  { id: 'n2', book: 'gn', chapter: 1, verseStart: 26, verseEnd: 27, text: 'Imago Dei. Comparar com Salmos 8 e Efésios 4:24.', excerpt: 'And God said, Let us make man in our image, after our likeness…', createdAt: now - 5 * day },
  { id: 'n3', book: 'jo', chapter: 3, verseStart: 16, verseEnd: 16, text: 'Versículo para memorizar. Começar pelo "God so loved".', excerpt: 'For God so loved the world, that he gave his only begotten Son…', createdAt: now - 2 * day },
];

interface StudyStore {
  book: string;
  chapter: number;
  focusVerse: number | null;
  selection: number[];
  highlights: Record<string, Highlight>;
  notes: Note[];
  goTo: (book: string, chapter: number, verse?: number) => void;
  step: (delta: 1 | -1) => boolean;
  toggleVerse: (v: number) => void;
  clearSelection: () => void;
  clearFocus: () => void;
  paint: (color: HlColor, texts: Record<number, string>) => void;
  saveNote: (text: string, excerpt: string, existingId?: string) => void;
  deleteNote: (id: string) => void;
}

export const useStudy = create<StudyStore>((set, get) => ({
  book: 'gn',
  chapter: 1,
  focusVerse: null,
  selection: [],
  highlights: Object.fromEntries(seedHighlights.map((h) => [vkey(h.book, h.chapter, h.verse), h])),
  notes: seedNotes,
  goTo: (book, chapter, verse) => set({ book, chapter, focusVerse: verse ?? null, selection: [] }),
  step: (delta) => {
    const { book, chapter } = get();
    const i = bookIndex(book);
    let nb = i;
    let nc = chapter + delta;
    if (nc > BOOKS[i].chapters) {
      nb = i + 1;
      nc = 1;
    } else if (nc < 1) {
      nb = i - 1;
      nc = nb >= 0 ? BOOKS[nb].chapters : 0;
    }
    if (nb < 0 || nb >= BOOKS.length) return false;
    set({ book: BOOKS[nb].id, chapter: nc, focusVerse: null, selection: [] });
    return true;
  },
  toggleVerse: (v) =>
    set((s) => ({
      selection: s.selection.includes(v) ? s.selection.filter((x) => x !== v) : [...s.selection, v].sort((a, b) => a - b),
    })),
  clearSelection: () => set({ selection: [] }),
  clearFocus: () => set({ focusVerse: null }),
  paint: (color, texts) =>
    set((s) => {
      const { book, chapter, selection } = s;
      const keys = selection.map((v) => vkey(book, chapter, v));
      const allSame = keys.every((k) => s.highlights[k]?.color === color);
      const next = { ...s.highlights };
      selection.forEach((v, i) => {
        if (allSame) delete next[keys[i]];
        else next[keys[i]] = { book, chapter, verse: v, color, text: texts[v] ?? '', createdAt: Date.now() };
      });
      return { highlights: next };
    }),
  saveNote: (text, excerpt, existingId) =>
    set((s) => {
      const { book, chapter, selection } = s;
      if (existingId) return { notes: s.notes.map((n) => (n.id === existingId ? { ...n, text } : n)) };
      const note: Note = {
        id: crypto.randomUUID(),
        book,
        chapter,
        verseStart: selection[0],
        verseEnd: selection[selection.length - 1],
        text,
        excerpt,
        createdAt: Date.now(),
      };
      return { notes: [...s.notes, note] };
    }),
  deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}));
