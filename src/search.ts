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

const REF = /^\s*((?:[123]\s*)?[^\d:.,\-\s][^\d:.,-]*?)\s*(\d+)(?:(?:\s*[:.,]\s*|\s+)(\d+)(?:\s*-\s*(\d+))?)?\s*$/u;

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

/** Bible references found in running text, such as "Mateus 24:15" or "Marcos 13". Only books of the list count. */
export function findReferences(text: string, books: RefBook[]): { start: number; end: number; target: RefTarget }[] {
  type Found = { start: number; end: number; target: RefTarget };
  const tail = String.raw`\s*\d+(?:\s*:\s*\d+(?:\s*[-\u2010-\u2015\u2212]\s*\d+)?)?`;
  const scan = (re: RegExp): Found[] =>
    [...text.matchAll(re)].flatMap((m) => {
      const start = m.index!;
      const raw = m[0];
      const target = parseReference(raw.replace(/[\u2010-\u2015\u2212]/g, '-'), books);
      if (target) return [{ start, end: start + raw.length, target }];
      // "de Daniel 7": the first word is not part of the name, so try again without it.
      const rest = raw.replace(/^\S+\s+/, '');
      const again = rest !== raw ? parseReference(rest.replace(/[\u2010-\u2015\u2212]/g, '-'), books) : null;
      return again ? [{ start: start + raw.length - rest.length, end: start + raw.length, target: again }] : [];
    });
  // Numbered books first ("1 João 4:8"), so the number is not taken as the chapter of the word before it.
  const numbered = scan(new RegExp(String.raw`[123]\s?\p{L}[\p{L}.]*` + tail, 'gu'));
  const plain = scan(new RegExp(String.raw`\p{L}[\p{L}.]*(?:\s+\p{L}[\p{L}.]*)?` + tail, 'gu')).filter(
    (f) => !numbered.some((n) => f.start < n.end && n.start < f.end),
  );
  return [...numbered, ...plain].sort((a, b) => a.start - b.start);
}

export interface Hit {
  versionId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
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

export interface SearchIndex {
  versionId: string;
  chapters: { book: string; chapter: number; verses: string[]; norms?: string[] }[];
}

/** All verses with the terms in every index, whole word before start of word, and that before the rest. */
export function searchVerses(query: string, indexes: SearchIndex[], activeId?: string): Hit[] {
  const terms = normalize(query.trim()).norm.split(/\s+/).filter(Boolean);
  if (terms.length === 0 || terms.join('').length < minChars(query)) return [];

  const scored: { hit: Hit; score: number; at: number; order: number }[] = [];
  indexes.forEach(({ versionId, chapters }, order) => {
    for (const c of chapters) {
      for (let i = 0; i < c.verses.length; i++) {
        const norm = c.norms?.[i] ?? normalize(c.verses[i]).norm;
        let score = 0;
        let all = true;
        for (const t of terms) {
          const best = bestMatch(norm, t);
          if (best < 0) {
            all = false;
            break;
          }
          score += proximity(norm, best, t.length, t);
        }
        if (!all) continue;
        scored.push({
          hit: { versionId, book: c.book, chapter: c.chapter, verse: i + 1, text: c.verses[i] },
          score,
          at: bookIndex(c.book) * 1e7 + c.chapter * 1e3 + i + 1,
          order: versionId === activeId ? -1 : order,
        });
      }
    }
  });
  // Relevance first, then the canonical order, then the active version before the others.
  scored.sort((a, b) => a.score - b.score || a.at - b.at || a.order - b.order);
  return scored.map((x) => x.hit);
}

/** Start of the best occurrence of the term: whole word, then start of word. -1 when it is absent. */
function bestMatch(norm: string, t: string): number {
  let at = norm.indexOf(t);
  if (at < 0) return -1;
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
  return best;
}

/** Ranges [start, end) in the original text to highlight, for the terms of a query. */
export function highlightRanges(query: string, text: string): [number, number][] {
  const terms = normalize(query.trim()).norm.split(/\s+/).filter(Boolean);
  const { norm, map } = normalize(text);
  const ranges: [number, number][] = [];
  for (const t of terms) {
    const best = bestMatch(norm, t);
    if (best < 0) continue;
    const start = map[best];
    const last = map[best + t.length - 1];
    ranges.push([start, last + String.fromCodePoint(text.codePointAt(last)!).length]);
  }
  return mergeRanges(ranges);
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

/** Function words that say little about which verse is meant, in the languages of the app. Compared without accents. */
const STOP = new Set(
  `o a os as um uma uns umas de do da dos das em no na nos nas por para com sem que e ou se ao aos sobre pelo pela
   the an of to in on and or for with that at by from
   el la los las un una del y con
   le les une des du et pour avec
   der die das ein eine und oder von zu mit`.split(/\s+/),
);

/** The words of a normalized text. */
const wordsOf = (norm: string) => norm.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Search stems of a sentence: the meaningful words cut to 4 letters, so "muitas" finds "muitos" and "lança" finds "lance". Empty for CJK. */
export function significantStems(query: string): string[] {
  const { norm } = normalize(query);
  if (CJK.test(norm)) return [];
  const out: string[] = [];
  for (const w of wordsOf(norm)) {
    if (w.length < 2 || STOP.has(w)) continue;
    const stem = w.length > 4 ? w.slice(0, 4) : w;
    if (!out.includes(stem)) out.push(stem);
  }
  return out;
}

/** How many of the stems start a word of the (normalized) text. */
export function stemsFound(norm: string, stems: string[]): number {
  const words = wordsOf(norm);
  return stems.filter((s) => words.some((w) => w.startsWith(s))).length;
}

/** The share of stems a verse needs to count as an approximate result. */
const APPROX_SHARE = 0.6;
/** How many approximate results are kept. */
export const APPROX_MAX = 30;

export interface ApproxResult {
  hits: Hit[];
  /** Share of the sentence's meaningful words found in the best verse, 0 to 1. */
  coverage: number;
}

/** Verses that hold most of the words of a sentence, for when no verse holds all of them. Best match first. */
export function searchApprox(query: string, indexes: SearchIndex[], activeId?: string): ApproxResult {
  const stems = significantStems(query);
  if (stems.length < 2) return { hits: [], coverage: 0 };
  const need = Math.max(2, Math.ceil(stems.length * APPROX_SHARE));
  const scored: { hit: Hit; found: number; at: number; order: number }[] = [];
  indexes.forEach(({ versionId, chapters }, order) => {
    for (const c of chapters) {
      for (let i = 0; i < c.verses.length; i++) {
        const found = stemsFound(c.norms?.[i] ?? normalize(c.verses[i]).norm, stems);
        if (found < need) continue;
        scored.push({
          hit: { versionId, book: c.book, chapter: c.chapter, verse: i + 1, text: c.verses[i] },
          found,
          at: bookIndex(c.book) * 1e7 + c.chapter * 1e3 + i + 1,
          order: versionId === activeId ? -1 : order,
        });
      }
    }
  });
  scored.sort((a, b) => b.found - a.found || a.at - b.at || a.order - b.order);
  return { hits: scored.slice(0, APPROX_MAX).map((x) => x.hit), coverage: scored.length ? scored[0].found / stems.length : 0 };
}

/** Ranges [start, end) in the original text of the words that match the stems of a sentence. */
export function approxRanges(query: string, text: string): [number, number][] {
  const stems = significantStems(query);
  const out: [number, number][] = [];
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const w = normalize(m[0]).norm;
    if (stems.some((s) => w.startsWith(s))) out.push([m.index!, m.index! + m[0].length]);
  }
  return out;
}
