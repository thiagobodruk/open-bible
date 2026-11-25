// Reading plans: pure logic with no UI. A plan is a flat list of chapters cut into daily readings.
import { BOOKS } from './books';

export type PresetId = 'bible1y' | 'nt90' | 'ot1y' | 'psprov' | 'gospels30' | 'paul30';

export interface Plan {
  id: string;
  /** Name given when the plan was created. Empty for the ready-made ones, whose name follows the interface language. */
  name: string;
  preset?: PresetId;
  /** Every chapter of the plan in reading order, as "<book>:<chapter>". */
  items: string[];
  /** Number of daily readings. Never more than the chapters. */
  days: number;
  startedAt: number;
  /** Indexes into `items` of the chapters already read. */
  done: number[];
  /** When a chapter was last marked. The plan with the latest one is the one the menu shows. */
  readAt?: number;
  /** When a whole daily reading was last completed. A single chapter of a longer reading does not count. */
  lastDoneAt?: number;
  /** Set when every chapter is read. */
  finishedAt?: number;
}

export interface Preset {
  id: PresetId;
  books: string[];
  days: number;
}

const ids = BOOKS.map((b) => b.id);
const range = (from: string, to: string) => ids.slice(ids.indexOf(from), ids.indexOf(to) + 1);

export const PRESETS: Preset[] = [
  { id: 'bible1y', books: ids, days: 365 },
  { id: 'nt90', books: range('mt', 'ap'), days: 90 },
  { id: 'ot1y', books: range('gn', 'ml'), days: 365 },
  { id: 'psprov', books: ['sl', 'pv'], days: 60 },
  { id: 'gospels30', books: range('mt', 'jo'), days: 30 },
  { id: 'paul30', books: range('rm', 'fm'), days: 30 },
];

export const MAX_DAYS = 3650;

const chapterCount = new Map(BOOKS.map((b) => [b.id, b.chapters]));
export const bookChapters = (id: string) => chapterCount.get(id) ?? 0;

export const itemOf = (book: string, chapter: number) => `${book}:${chapter}`;
export function parseItem(item: string): { book: string; chapter: number } {
  const i = item.lastIndexOf(':');
  return { book: item.slice(0, i), chapter: Number(item.slice(i + 1)) };
}

/** Every chapter of the books, in canonical order whatever the order they were given in. */
export function itemsOfBooks(books: string[]): string[] {
  const set = new Set(books);
  return BOOKS.filter((b) => set.has(b.id)).flatMap((b) => Array.from({ length: b.chapters }, (_, i) => itemOf(b.id, i + 1)));
}

/** Chapters picked book by book ({ gn: [1, 2], sl: [23] }) as plan items, in canonical order. */
export function itemsOfPicks(picks: Record<string, Iterable<number>>): string[] {
  return BOOKS.flatMap((b) => [...new Set(picks[b.id] ?? [])].filter((c) => c >= 1 && c <= b.chapters).sort((x, y) => x - y).map((c) => itemOf(b.id, c)));
}

/** A plan cannot have more daily readings than chapters. */
export const effectiveDays = (chapters: number, days: number) => Math.max(1, Math.min(Math.round(days) || 1, chapters));

export interface Reading {
  /** First chapter of the reading, as an index into `items`. */
  start: number;
  /** One past the last. */
  end: number;
}

/** Cuts the chapters into `days` consecutive readings that differ in size by at most one chapter. */
export function readingsOf(plan: Pick<Plan, 'items' | 'days'>): Reading[] {
  const n = plan.items.length;
  const days = effectiveDays(n, plan.days);
  return Array.from({ length: days }, (_, d) => ({ start: Math.floor((d * n) / days), end: Math.floor(((d + 1) * n) / days) }));
}

export const chaptersPerDay = (chapters: number, days: number) => chapters / effectiveDays(chapters, days);

export function isRead(plan: Pick<Plan, 'done'>, r: Reading, done = new Set(plan.done)) {
  for (let i = r.start; i < r.end; i++) if (!done.has(i)) return false;
  return true;
}

export interface Progress {
  /** Readings fully done. */
  done: number;
  total: number;
  /** Index of the first reading not done, or -1 when the plan is complete. */
  next: number;
  percent: number;
}

export function progressOf(plan: Plan): Progress {
  const done = new Set(plan.done);
  const readings = readingsOf(plan);
  let count = 0;
  let next = -1;
  readings.forEach((r, i) => {
    if (isRead(plan, r, done)) count++;
    else if (next < 0) next = i;
  });
  return { done: count, total: readings.length, next, percent: readings.length ? Math.floor((count / readings.length) * 100) : 0 };
}

/** First chapter of the reading that is not read yet. */
export function firstUnread(plan: Plan, r: Reading): { book: string; chapter: number } {
  const done = new Set(plan.done);
  for (let i = r.start; i < r.end; i++) if (!done.has(i)) return parseItem(plan.items[i]);
  return parseItem(plan.items[r.start]);
}

/** Chapters of the reading that are still to read. */
export const chaptersLeft = (plan: Plan, r: Reading) => {
  const done = new Set(plan.done);
  let n = 0;
  for (let i = r.start; i < r.end; i++) if (!done.has(i)) n++;
  return n;
};

/** Consecutive chapters of one book collapse into a range: "Genesis 50, Exodus 1–2". */
export function refOfItems(items: string[], name: (book: string) => string): string {
  const groups: { book: string; from: number; to: number }[] = [];
  for (const it of items) {
    const { book, chapter } = parseItem(it);
    const last = groups[groups.length - 1];
    if (last && last.book === book && chapter === last.to + 1) last.to = chapter;
    else groups.push({ book, from: chapter, to: chapter });
  }
  return groups.map((g) => `${name(g.book)} ${g.from === g.to ? g.from : `${g.from}–${g.to}`}`).join(', ');
}

/** "Deuteronomy" becomes "Deu.", "1 Samuel" becomes "1 Sam.". Short names, like those of Chinese and Japanese, stay whole. */
export function shortName(name: string): string {
  const m = /^(\d+\s?)?(.*)$/.exec(name.trim());
  const num = m?.[1] ?? '';
  const rest = m?.[2] ?? name;
  return [...rest].length > 6 ? `${num}${[...rest].slice(0, 3).join('')}.` : name.trim();
}

/** Name for a custom plan: the book when the plan has just one, otherwise `fallback`. */
export function customName(items: string[], name: (book: string) => string, fallback: string) {
  const books = new Set(items.map((i) => parseItem(i).book));
  return books.size === 1 ? name([...books][0]) : fallback;
}

export function newPlan(init: { name: string; preset?: PresetId; items: string[]; days: number }, now = Date.now()): Plan {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    name: init.name,
    ...(init.preset ? { preset: init.preset } : {}),
    items: init.items,
    days: effectiveDays(init.items.length, init.days),
    startedAt: now,
    done: [],
  };
}

/** Marks or unmarks chapters (indexes into `items`) and keeps `readAt` and `finishedAt` in step. */
export function withMarks(plan: Plan, indexes: number[], on: boolean, now = Date.now()): Plan {
  const set = new Set(plan.done);
  for (const i of indexes) {
    if (i < 0 || i >= plan.items.length) continue;
    if (on) set.add(i);
    else set.delete(i);
  }
  const done = [...set].sort((a, b) => a - b);
  const next: Plan = { ...plan, done, ...(on ? { readAt: now } : {}) };
  if (done.length === plan.items.length) next.finishedAt = plan.finishedAt ?? now;
  else delete next.finishedAt;
  const before = progressOf(plan).done;
  const after = progressOf(next).done;
  if (after > before) next.lastDoneAt = now;
  else if (after < before) delete next.lastDoneAt;
  return next;
}

/** Reading plan the menu shows: the unfinished one touched most recently. */
export function latestActive(plans: Plan[]): Plan | undefined {
  let best: Plan | undefined;
  for (const p of plans) {
    if (p.finishedAt) continue;
    if (!best || (p.readAt ?? p.startedAt) > (best.readAt ?? best.startedAt)) best = p;
  }
  return best;
}

/** Index of the chapter in the plan, when it is part of it and not read yet. */
export function pendingIndex(plan: Plan, book: string, chapter: number): number {
  const i = plan.items.indexOf(itemOf(book, chapter));
  return i >= 0 && !plan.done.includes(i) ? i : -1;
}

/** Keeps only what makes a valid plan (used when reading a backup). */
export function sanitizePlan(raw: unknown): Plan | null {
  const p = raw as Partial<Plan> | null;
  if (!p || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !Array.isArray(p.items) || !p.items.length || p.items.length > 1200) return null;
  const items = p.items.filter((i): i is string => {
    if (typeof i !== 'string') return false;
    const { book, chapter } = parseItem(i);
    return Number.isInteger(chapter) && chapter >= 1 && chapter <= bookChapters(book);
  });
  if (items.length !== p.items.length) return null;
  const done = (Array.isArray(p.done) ? p.done : []).filter((i): i is number => Number.isInteger(i) && i >= 0 && i < items.length);
  const plan: Plan = {
    id: p.id,
    name: p.name.slice(0, 80),
    ...(p.preset && PRESETS.some((x) => x.id === p.preset) ? { preset: p.preset } : {}),
    items,
    days: effectiveDays(items.length, Number(p.days)),
    startedAt: Number.isFinite(p.startedAt) ? (p.startedAt as number) : Date.now(),
    done: [...new Set(done)].sort((a, b) => a - b),
    ...(Number.isFinite(p.readAt) ? { readAt: p.readAt } : {}),
    ...(Number.isFinite(p.lastDoneAt) ? { lastDoneAt: p.lastDoneAt } : {}),
  };
  if (plan.done.length === items.length) plan.finishedAt = Number.isFinite(p.finishedAt) ? (p.finishedAt as number) : Date.now();
  return plan;
}
