import { useMemo } from 'react';
import { useSettings, type UiLang } from '../state/settings';
import en, { type Messages } from './locales/en';
import ptBR from './locales/pt-BR';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import zhCN from './locales/zh-CN';
import ja from './locales/ja';

export type Key = keyof Messages;
type Params = Record<string, string | number>;
/** Chaves que têm formas `_one` e `_other`. */
export type PluralKey = { [K in Key]: K extends `${infer B}_one` ? B : never }[Key];

export const LOCALES: Record<UiLang, Messages> = { en, 'pt-BR': ptBR, es, fr, de, 'zh-CN': zhCN, ja };

const fill = (s: string, p?: Params) => (p ? s.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? `{${k}}`)) : s);

export function translate(lang: UiLang, key: Key, params?: Params): string {
  return fill(LOCALES[lang][key] ?? en[key], params);
}

export function translatePlural(lang: UiLang, key: PluralKey, n: number, params?: Params): string {
  const cat = new Intl.PluralRules(lang).select(n);
  const table = LOCALES[lang];
  const k = (`${key}_${cat}` in table ? `${key}_${cat}` : `${key}_other`) as Key;
  return fill(table[k] ?? en[`${key}_other` as Key], { n, ...params });
}

export interface Translator {
  (key: Key, params?: Params): string;
  /** Texto com concordância de número: `t.n('verse', 3)`. */
  n: (key: PluralKey, n: number, params?: Params) => string;
  lang: UiLang;
}

export function makeTranslator(lang: UiLang): Translator {
  const t = ((key: Key, params?: Params) => translate(lang, key, params)) as Translator;
  t.n = (key, n, params) => translatePlural(lang, key, n, params);
  t.lang = lang;
  return t;
}

/** Tradutor para componentes: renderiza de novo quando o idioma da interface muda. */
export function useT(): Translator {
  const lang = useSettings((s) => s.uiLang);
  return useMemo(() => makeTranslator(lang), [lang]);
}

/** Tradutor para código fora de componentes (toasts, por exemplo). Lê o idioma atual a cada chamada. */
export const tr = (key: Key, params?: Params) => translate(useSettings.getState().uiLang, key, params);

/** Divide um texto traduzido em `{icon}` para inserir um ícone no meio da frase. */
export function splitIcon(text: string): [string, string] {
  const i = text.indexOf('{icon}');
  return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i + 6)];
}
