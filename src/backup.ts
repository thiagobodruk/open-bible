import { BOOKS } from './data/books';

const chaptersOf = new Map(BOOKS.map((b) => [b.id, b.chapters]));
import { HL_COLORS, useStudy, vkey, type Highlight, type HlColor, type Note } from './state/study';

const APP = 'open-bible';
const SCHEMA = 1;
const MAX_NOTE = 5000;

export interface Backup {
  app: typeof APP;
  schema: number;
  exportedAt: string;
  highlights: Highlight[];
  notes: Note[];
}

export function buildBackup(): Backup {
  const { highlights, notes } = useStudy.getState();
  return { app: APP, schema: SCHEMA, exportedAt: new Date().toISOString(), highlights: Object.values(highlights), notes };
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `open-bible-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const ids = new Set(BOOKS.map((b) => b.id));
const isInt = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0;
const str = (v: unknown): v is string => typeof v === 'string';

/** Lê um backup e devolve só os registros válidos. Lança erro se o arquivo não for um backup do Open Bible. */
export function parseBackup(text: string): { highlights: Highlight[]; notes: Note[]; skipped: number } {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('invalid');
  }
  if (!raw || raw.app !== APP || typeof raw.schema !== 'number' || raw.schema > SCHEMA) throw new Error('invalid');

  let skipped = 0;
  const highlights: Highlight[] = [];
  for (const h of Array.isArray(raw.highlights) ? raw.highlights : []) {
    if (!h || !ids.has(h.book) || !isInt(h.chapter) || h.chapter > chaptersOf.get(h.book)! || !isInt(h.verse) || !HL_COLORS.includes(h.color as HlColor)) {
      skipped++;
      continue;
    }
    highlights.push({
      key: vkey(h.book, h.chapter, h.verse),
      book: h.book,
      chapter: h.chapter,
      verse: h.verse,
      color: h.color,
      text: str(h.text) ? h.text : '',
      versionId: str(h.versionId) ? h.versionId : '',
      createdAt: Number.isFinite(h.createdAt) ? h.createdAt : Date.now(),
    });
  }

  const notes: Note[] = [];
  for (const n of Array.isArray(raw.notes) ? raw.notes : []) {
    if (!n || !str(n.id) || !str(n.text) || !ids.has(n.book) || !isInt(n.chapter) || n.chapter > chaptersOf.get(n.book)! || !isInt(n.verseStart) || !isInt(n.verseEnd)) {
      skipped++;
      continue;
    }
    notes.push({
      id: n.id,
      book: n.book,
      chapter: n.chapter,
      verseStart: Math.min(n.verseStart, n.verseEnd),
      verseEnd: Math.max(n.verseStart, n.verseEnd),
      text: n.text.slice(0, MAX_NOTE),
      excerpt: str(n.excerpt) ? n.excerpt : '',
      versionId: str(n.versionId) ? n.versionId : '',
      createdAt: Number.isFinite(n.createdAt) ? n.createdAt : Date.now(),
      ...(Number.isFinite(n.updatedAt) ? { updatedAt: n.updatedAt } : {}),
    });
  }
  return { highlights, notes, skipped };
}
