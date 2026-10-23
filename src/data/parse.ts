import { BOOKS } from './books';
import type { BookText } from './bible';

/** Valida o JSON de uma versão e devolve só os livros conhecidos, com texto em string. Lança erro se o formato não for o esperado. */
export function parseVersion(raw: unknown): BookText[] {
  if (!Array.isArray(raw)) throw new Error('formato inesperado');
  const known = new Set(BOOKS.map((b) => b.id));
  const out: BookText[] = [];
  for (const b of raw) {
    if (!b || typeof b.abbrev !== 'string' || !Array.isArray(b.chapters)) continue;
    if (!known.has(b.abbrev) || out.some((x) => x.id === b.abbrev)) continue;
    const chapters = b.chapters.map((c: unknown) =>
      Array.isArray(c) ? c.filter((v) => typeof v === 'string').map((v: string) => v.trim()) : [],
    );
    if (chapters.length === 0) continue;
    out.push({ id: b.abbrev, name: typeof b.name === 'string' && b.name ? b.name : b.abbrev, chapters });
  }
  if (out.length === 0) throw new Error('nenhum livro reconhecido');
  return out;
}
