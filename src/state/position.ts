// Posição de leitura: espelho síncrono em localStorage, para abrir já no lugar certo.
const KEY = 'ob:position';

export function loadPosition(): { book: string; chapter: number } | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (p && typeof p.book === 'string' && Number.isInteger(p.chapter) && p.chapter > 0) return p;
  } catch {
    /* ignora */
  }
  return null;
}

export function savePosition(book: string, chapter: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ book, chapter }));
  } catch {
    /* sem persistência */
  }
}
