import { BOOKS } from './data/books';
import { findVersion } from './data/catalog';

export interface ReadLink {
  versionId: string;
  book: string;
  chapter: number;
}

const base = import.meta.env.BASE_URL;

/** Endereço de uma leitura: /open-bible/pt_nvi/jn/3 */
export const readPath = (versionId: string, book: string, chapter: number) => `${base}${versionId}/${book}/${chapter}`;

/** Lê um endereço de leitura. Versão ou livro desconhecidos invalidam o link. Capítulo fora do limite vira o mais próximo. */
export function parseReadPath(pathname: string): ReadLink | null {
  if (!pathname.startsWith(base)) return null;
  const [v, b, c] = pathname.slice(base.length).split('/').filter(Boolean).map((x) => decodeURIComponent(x).toLowerCase());
  const book = BOOKS.find((x) => x.id === b);
  if (!v || !book || !findVersion(v)) return null;
  const n = Math.trunc(Number(c));
  return { versionId: v, book: book.id, chapter: Number.isFinite(n) ? Math.min(Math.max(n, 1), book.chapters) : 1 };
}

/** Endereço do app, sem leitura. É o que o botão de compartilhar envia. */
export const appUrl = () => new URL(base, location.origin).href;
