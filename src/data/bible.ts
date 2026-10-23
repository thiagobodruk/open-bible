import { dbDelete, dbDeleteRange, dbGet, dbPut, dbRange } from '../db';

export interface BookText {
  id: string;
  name: string;
  /** chapters[0] é o capítulo 1; cada capítulo é uma lista de versículos. */
  chapters: string[][];
}

export interface VersionMeta {
  id: string;
  installedAt: number;
  /** Livros presentes na versão, na ordem canônica. */
  books: { id: string; name: string; chapters: number }[];
}

const key = (versionId: string, bookId: string) => `${versionId}:${bookId}`;

// Cache pequeno em memória: o livro aberto e os vizinhos.
const cache = new Map<string, BookText>();
const MAX_CACHE = 6;

export async function loadBook(versionId: string, bookId: string): Promise<BookText | undefined> {
  const k = key(versionId, bookId);
  const hit = cache.get(k);
  if (hit) {
    cache.delete(k);
    cache.set(k, hit);
    return hit;
  }
  const book = await dbGet<BookText>('books', k);
  if (book) {
    cache.set(k, book);
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
  }
  return book;
}

export async function loadAllBooks(versionId: string): Promise<BookText[]> {
  return dbRange<BookText>('books', `${versionId}:`);
}

/** Grava a versão inteira. A meta só entra por último, então uma gravação interrompida não deixa versão "instalada" pela metade. */
export async function saveVersion(id: string, books: BookText[], order: (bookId: string) => number): Promise<VersionMeta> {
  await dbDeleteRange('books', `${id}:`);
  await dbPut('books', books, books.map((b) => key(id, b.id)));
  const meta: VersionMeta = {
    id,
    installedAt: Date.now(),
    books: books
      .map((b) => ({ id: b.id, name: b.name, chapters: b.chapters.length }))
      .sort((a, b) => order(a.id) - order(b.id)),
  };
  await dbPut('versions', [meta]);
  return meta;
}

export async function deleteVersion(id: string): Promise<void> {
  await dbDelete('versions', [id]);
  await dbDeleteRange('books', `${id}:`);
  for (const k of [...cache.keys()]) if (k.startsWith(`${id}:`)) cache.delete(k);
  if (indexed?.versionId === id) indexed = null;
}

export interface IndexedChapter {
  book: string;
  chapter: number;
  verses: string[];
}

let indexed: { versionId: string; chapters: IndexedChapter[] } | null = null;

/** Todos os capítulos da versão, na ordem em que foram lidos do IndexedDB. Fica em memória só para a última versão buscada. */
export async function loadSearchIndex(versionId: string): Promise<IndexedChapter[]> {
  if (indexed?.versionId === versionId) return indexed.chapters;
  const books = await loadAllBooks(versionId);
  const chapters = books.flatMap((b) => b.chapters.map((verses, i) => ({ book: b.id, chapter: i + 1, verses })));
  indexed = { versionId, chapters };
  return chapters;
}
