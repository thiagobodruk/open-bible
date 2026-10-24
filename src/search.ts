import { bookIndex } from './data/books';

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

/** "jo 3:16", "1 co 13", "salmos 23", "gn1". Nome do livro na versão atual ou abbrev. */
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
  /** Intervalos [início, fim) no texto original, para destaque. */
  ranges: [number, number][];
}

/** Quantos resultados aparecem de cada vez. */
export const PAGE_SIZE = 100;
/** Em chinês e japonês um único caractere já é uma palavra. */
export const minChars = (q: string) => (/[\u3040-\u30ff\u3400-\u9fff]/.test(q) ? 1 : 2);

const CJK = /[\u3040-\u30ff\u3400-\u9fff]/;
const WORD = /[\p{L}\p{N}]/u;

/** 0 = palavra inteira, 1 = início de palavra, 2 = dentro de outra palavra. */
function proximity(norm: string, at: number, len: number, term: string): number {
  if (CJK.test(term)) return 0;
  if (at > 0 && WORD.test(norm[at - 1])) return 2;
  return at + len < norm.length && WORD.test(norm[at + len]) ? 1 : 0;
}

/** Todos os versículos com os termos, a palavra inteira antes do início de palavra, e este antes do resto. */
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
        // Procura a melhor ocorrência do termo: palavra inteira, depois início de palavra.
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
  // Ordenação estável: dentro da mesma nota, mantém a ordem canônica.
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
