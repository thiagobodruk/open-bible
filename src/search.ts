import { bookIndex } from './data/books';

/** Lowercase, without accents and without combining marks. Also returns the index map back to the original text. */
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

export interface RefBook {
  id: string;
  name: string;
  chapters: number;
}

export interface RefTarget {
  book: RefBook;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

const REF = /^\s*((?:[123]\s*)?[^\d:.,\-\s][^\d:.,-]*?)\s*(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?\s*$/u;

/** "jo 3:16", "1 co 13", "salmos 23", "gn1". Book name in the current version or abbrev. */
export function parseReference(input: string, books: RefBook[]): RefTarget | null {
  const m = REF.exec(input);
  if (!m) return null;
  const q = fold(m[1]);
  if (!q) return null;
  const exact = m[1].replace(/\s+/g, '').toLowerCase();
  const book =
    books.find((b) => b.id === exact) ?? books.find((b) => fold(b.id) === q) ?? books.find((b) => fold(b.name).startsWith(q));
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
  /** Ranges [start, end) in the original text, for highlighting. */
  ranges: [number, number][];
}

/** How many results show at a time. */
export const PAGE_SIZE = 100;
/** In Chinese and Japanese a single character is already a word. */
export const minChars = (q: string) => (/[\u3040-\u30ff\u3400-\u9fff]/.test(q) ? 1 : 2);

const CJK = /[\u3040-\u30ff\u3400-\u9fff]/;
const WORD = /[\p{L}\p{N}]/u;

/** 0 = whole word, 1 = start of word, 2 = inside another word. */
function proximity(norm: string, at: number, len: number, term: string): number {
  if (CJK.test(term)) return 0;
  if (at > 0 && WORD.test(norm[at - 1])) return 2;
  return at + len < norm.length && WORD.test(norm[at + len]) ? 1 : 0;
}

/** All verses with the terms, whole word before start of word, and that before the rest. */
export function searchVerses(
  query: string,
  chapters: { book: string; chapter: number; verses: string[] }[],
): Hit[] {
  const terms = normalize(query.trim()).norm.split(/\s+/).filter(Boolean);
  if (terms.length === 0 || terms.join('').length < minChars(query)) return [];

  const scored: { hit: Hit; score: number }[] = [];
  const ordered = [...chapters].sort((a, b) => bookIndex(a.book) - bookIndex(b.book) || a.chapter - b.chapter);
  for (const c of ordered) {
    for (let i = 0; i < c.verses.length; i++) {
      const text = c.verses[i];
      const { norm, map } = normalize(text);
      const ranges: [number, number][] = [];
      let score = 0;
      let all = true;
      for (const t of terms) {
        // Looks for the best occurrence of the term: whole word, then start of word.
        let at = norm.indexOf(t);
        if (at < 0) {
          all = false;
          break;
        }
        let best = at;
        let bestScore = proximity(norm, at, t.length, t);
        while (bestScore > 0) {
          at = norm.indexOf(t, at + 1);
          if (at < 0) break;
          const sc = proximity(norm, at, t.length, t);
          if (sc < bestScore) {
            best = at;
            bestScore = sc;
          }
        }
        score += bestScore;
        const start = map[best];
        const last = map[best + t.length - 1];
        const end = last + String.fromCodePoint(text.codePointAt(last)!).length;
        ranges.push([start, end]);
      }
      if (!all) continue;
      scored.push({ hit: { book: c.book, chapter: c.chapter, verse: i + 1, text, ranges: mergeRanges(ranges) }, score });
    }
  }
  // Stable sort: within the same score, keeps the canonical order.
  return scored.sort((a, b) => a.score - b.score).map((x) => x.hit);
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
