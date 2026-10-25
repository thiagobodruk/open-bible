import { BOOKS } from './data/books';
import { findVersion } from './data/catalog';

export interface ReadLink {
  versionId: string;
  book: string;
  chapter: number;
  /** Trecho do capítulo, quando o link aponta para versículos. */
  verses?: { from: number; to: number };
}

const base = import.meta.env.BASE_URL;

/** Endereço de uma leitura: /open-bible/pt_nvi/jn/3, ou /open-bible/pt_nvi/jn/3/16-17 para um trecho. */
export const readPath = (versionId: string, book: string, chapter: number, verses?: { from: number; to: number }) =>
  `${base}${versionId}/${book}/${chapter}${verses ? `/${verses.from === verses.to ? verses.from : `${verses.from}-${verses.to}`}` : ''}`;

/** Endereço completo de um trecho, o que vai na mensagem de compartilhar. */
export const shareUrl = (versionId: string, book: string, chapter: number, verses: { from: number; to: number }) =>
  new URL(readPath(versionId, book, chapter, verses), location.origin).href;

/** "16" ou "16-17". Qualquer outra forma é ignorada, e o link abre só o capítulo. */
function parseVerses(s?: string): ReadLink['verses'] {
  const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(s ?? '');
  if (!m) return undefined;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  return from >= 1 && to >= from ? { from, to } : undefined;
}

/** Lê um endereço de leitura. Versão ou livro desconhecidos invalidam o link. Capítulo fora do limite vira o mais próximo. */
export function parseReadPath(pathname: string): ReadLink | null {
  if (!pathname.startsWith(base)) return null;
  const [v, b, c, vs] = pathname.slice(base.length).split('/').filter(Boolean).map((x) => decodeURIComponent(x).toLowerCase());
  const book = BOOKS.find((x) => x.id === b);
  if (!v || !book || !findVersion(v)) return null;
  const n = Math.trunc(Number(c));
  const chapter = Number.isFinite(n) ? Math.min(Math.max(n, 1), book.chapters) : 1;
  // Se o capítulo foi ajustado, o trecho já não vale.
  const verses = chapter === n ? parseVerses(vs) : undefined;
  return { versionId: v, book: book.id, chapter, ...(verses && { verses }) };
}

/** Endereço do app, sem leitura. É o que o botão de compartilhar envia. */
export const appUrl = () => new URL(base, location.origin).href;
