import { BOOKS } from './books';
import type { BookText } from './bible';

/** Algumas versões (en_bbe, fr_apee) usam abbrevs em inglês. Mapeia para os ids usados pelo app. */
const ALIASES: Record<string, string> = {
  jud: 'jz', '1kgs': '1rs', '2kgs': '2rs', '1ch': '1cr', '2ch': '2cr', ezr: 'ed', job: 'jó', ps: 'sl', prv: 'pv',
  so: 'ct', ho: 'os', mi: 'mq', hk: 'hc', zp: 'sf', hg: 'ag', mk: 'mc', lk: 'lc', act: 'atos', eph: 'ef',
  ph: 'fp', phm: 'fm', jm: 'tg', re: 'ap',
};

/** Valida o JSON de uma versão e devolve só os livros conhecidos, com texto em string. Lança erro se o formato não for o esperado. */
export function parseVersion(raw: unknown): BookText[] {
  if (!Array.isArray(raw)) throw new Error('formato inesperado');
  const known = new Set(BOOKS.map((b) => b.id));
  const out: BookText[] = [];
  for (const b of raw) {
    if (!b || typeof b.abbrev !== 'string' || !Array.isArray(b.chapters)) continue;
    const id = known.has(b.abbrev) ? b.abbrev : ALIASES[b.abbrev];
    if (!id || out.some((x) => x.id === id)) continue;
    const chapters = b.chapters.map((c: unknown) =>
      Array.isArray(c) ? c.filter((v) => typeof v === 'string').map((v: string) => v.trim()) : [],
    );
    if (chapters.length === 0) continue;
    out.push({ id, name: typeof b.name === 'string' && b.name ? b.name : id, chapters });
  }
  if (out.length === 0) throw new Error('nenhum livro reconhecido');
  return out;
}
