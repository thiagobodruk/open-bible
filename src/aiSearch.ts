// Tells a plain keyword search from a request meant for the AI, such as "texts about perseverance".
// It runs on the device. A weak local result also lets the search ask the AI by itself, within a daily limit.

import { findReferences, type RefBook, type RefTarget } from './search';
import { getJson, setItem } from './storage';

/** Words that start a request or a question, per language (compared without accents). */
const LEADS: Record<string, string[]> = {
  en: ['verses', 'passages', 'texts', 'scriptures', 'what', 'how', 'why', 'who', 'where', 'when', 'which', 'show', 'find', 'list', 'give', 'tell', 'explain', 'does', 'is', 'are', 'can'],
  'pt-BR': ['versiculos', 'passagens', 'textos', 'trechos', 'o que', 'como', 'por que', 'porque', 'quem', 'onde', 'quando', 'qual', 'quais', 'traga', 'mostre', 'liste', 'busque', 'encontre', 'explique', 'existe', 'a biblia'],
  es: ['versiculos', 'pasajes', 'textos', 'que', 'como', 'por que', 'quien', 'donde', 'cuando', 'cual', 'cuales', 'muestra', 'busca', 'dame', 'explica'],
  fr: ['versets', 'passages', 'textes', 'que', 'quoi', 'comment', 'pourquoi', 'qui', 'ou', 'quand', 'quel', 'quels', 'montre', 'trouve', 'donne', 'explique'],
  de: ['verse', 'stellen', 'texte', 'was', 'wie', 'warum', 'wer', 'wo', 'wann', 'welche', 'zeige', 'finde', 'nenne', 'erklare'],
  'zh-CN': ['有哪些', '哪些', '什么', '为什么', '如何', '怎么', '请', '找', '关于'],
  ja: ['どんな', '何', 'なぜ', 'どう', '教えて', '探して', '聖句', '箇所'],
};

/** From this many words a search is taken as a sentence, not as keywords. */
export const PROMPT_WORDS = 4;

const flat = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** True when the text reads like a request: it ends in "?", has several words, or opens with a request or question word. */
export function looksLikePrompt(query: string, lang: string): boolean {
  const q = flat(query);
  if (!q) return false;
  if (/[?？]\s*$/.test(q)) return true;
  if (q.split(/\s+/).length >= PROMPT_WORDS) return true;
  const leads = LEADS[lang] ?? LEADS.en;
  if (/[぀-ヿ㐀-鿿]/.test(q)) return q.length >= 3 && leads.some((l) => q.startsWith(l));
  const words = q.split(/\s+/);
  return words.length >= 2 && leads.some((l) => (q === l || q.startsWith(`${l} `)) && words.length >= l.split(' ').length + 1);
}

/** Below this share of the sentence's words in the best verse, the local search is weak and the AI is asked by itself. */
export const AUTO_COVERAGE = 0.8;
/** Automatic questions per device per day. The rest of the daily quota stays for questions the reader asks. */
export const AUTO_DAILY_CAP = 10;
/** Pause after the last keystroke before the automatic question. */
export const AUTO_DELAY = 1000;
/** Verses of the local search sent to the AI as candidates. */
export const CANDIDATES = 10;

const AUTO_KEY = 'ob.autoAsk';
const today = () => new Date().toISOString().slice(0, 10);

/** Automatic questions still allowed today. */
export function autoAskLeft(): number {
  const u = getJson<{ day?: string; n?: number }>(AUTO_KEY, {});
  return u.day === today() ? Math.max(0, AUTO_DAILY_CAP - (u.n ?? 0)) : AUTO_DAILY_CAP;
}

export function countAutoAsk() {
  const u = getJson<{ day?: string; n?: number }>(AUTO_KEY, {});
  setItem(AUTO_KEY, JSON.stringify({ day: today(), n: (u.day === today() ? u.n ?? 0 : 0) + 1 }));
}

export interface Suggestion {
  target: RefTarget;
  /** What the AI says about the passage. */
  note: string;
}

/** The passages of a topic answer ("- **Book 1:2** - why"). While it streams, the last line may be incomplete and is left out. */
export function parseSuggestions(text: string, books: RefBook[], complete: boolean): Suggestion[] {
  const lines = text.split('\n');
  if (!complete) lines.pop();
  const out: Suggestion[] = [];
  for (const raw of lines) {
    const m = /^\s*[-*•]\s+(.*)$/.exec(raw);
    if (!m) continue;
    const line = m[1].replace(/\*\*/g, '');
    const found = findReferences(line, books)[0];
    if (!found || found.target.verse === undefined) continue;
    const note = line.slice(found.end).replace(/^[\s\-–—:·,.]+/, '').trim();
    out.push({ target: found.target, note });
  }
  return out;
}
