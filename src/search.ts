import { BOOKS, bookIndex, type Book } from './data/books';

/** Minúsculas, sem acentos e sem sinais combinantes. Devolve também o mapa de índices para o texto original. */
export function normalize(text: string): { norm: string; map: number[] } {
  let norm = '';
  const map: number[] = [];
  let i = 0;
  for (const ch of text) {
    const n = ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    for (let k = 0; k < n.length; k++) map.push(i);
    norm += n;
    i += ch.length;
  }
  return { norm, map };
}

const fold = (s: string) => normalize(s).norm.replace(/\s+/g, '');

export interface RefTarget {
  book: Book;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

const REF = /^\s*((?:[123]\s*)?[^\d:.,\-\s][^\d:.,-]*?)\s*(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?\s*$/u;

/** "jo 3:16", "1 co 13", "salmos 23", "gn1". Nome do livro na versão atual ou abbrev. */
export function parseReference(input: string): RefTarget | null {
  const m = REF.exec(input);
  if (!m) return null;
  const q = fold(m[1]);
  if (!q) return null;
  const book = BOOKS.find((b) => b.id === q) ?? BOOKS.find((b) => fold(b.name).startsWith(q));
  if (!book) return null;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  return { book, chapter, verse: m[3] ? Number(m[3]) : undefined, verseEnd: m[4] ? Number(m[4]) : undefined };
}

export interface Hit {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  /** Intervalos [início, fim) no texto original, para destaque. */
  ranges: [number, number][];
}

export const MAX_HITS = 200;
export const MIN_CHARS = 2;

export function searchVerses(
  query: string,
  chapters: { book: string; chapter: number; verses: string[] }[],
): { hits: Hit[]; truncated: boolean } {
  const terms = normalize(query.trim()).norm.split(/\s+/).filter(Boolean);
  if (terms.length === 0 || terms.join('').length < MIN_CHARS) return { hits: [], truncated: false };

  const hits: Hit[] = [];
  const ordered = [...chapters].sort((a, b) => bookIndex(a.book) - bookIndex(b.book) || a.chapter - b.chapter);
  for (const c of ordered) {
    for (let i = 0; i < c.verses.length; i++) {
      const text = c.verses[i];
      const { norm, map } = normalize(text);
      const ranges: [number, number][] = [];
      let all = true;
      for (const t of terms) {
        const at = norm.indexOf(t);
        if (at < 0) {
          all = false;
          break;
        }
        const start = map[at];
        const endIdx = at + t.length - 1;
        const last = map[endIdx];
        const end = last + (String.fromCodePoint(text.codePointAt(last)!).length);
        ranges.push([start, end]);
      }
      if (!all) continue;
      if (hits.length >= MAX_HITS) return { hits, truncated: true };
      hits.push({ book: c.book, chapter: c.chapter, verse: i + 1, text, ranges: mergeRanges(ranges) });
    }
  }
  return { hits, truncated: false };
}

function mergeRanges(r: [number, number][]): [number, number][] {
  const sorted = [...r].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const cur of sorted) {
    const prev = out[out.length - 1];
    if (prev && cur[0] <= prev[1]) prev[1] = Math.max(prev[1], cur[1]);
    else out.push([...cur]);
  }
  return out;
}
