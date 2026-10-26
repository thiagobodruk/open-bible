import catalog from './catalog.json';

export interface VersionInfo {
  id: string;
  lang: string; // ISO code, used with Intl.DisplayNames
  name: string;
  sizeMb: number;
  books: number;
  coverage?: 'nt' | 'ot' | 'partial';
  rtl?: boolean;
}

/** Commit of the thiagobodruk/bible repo the catalog was generated from. Downloads use the same commit. */
export const CATALOG_SHA: string = catalog.sha;
export const VERSIONS = catalog.versions as VersionInfo[];

export const abbrOf = (id: string) => id.split('_').slice(1).join('_').toUpperCase();
export const findVersion = (id: string) => VERSIONS.find((v) => v.id === id);

/** First version choice per UI language. Only applies if that language has nothing downloaded yet. */
const SUGGESTED: Record<string, string> = {
  en: 'en_web',
  'pt-BR': 'pt_nvi',
  es: 'es_rvr1960',
  fr: 'fr_apee',
  de: 'de_sch1951',
  'zh-CN': 'zh_cnvs',
  ja: 'ja_jniv',
};
export const suggestedVersion = (uiLang: string) => SUGGESTED[uiLang] ?? 'en_web';

export const versionUrls = (id: string) => [
  `https://cdn.jsdelivr.net/gh/thiagobodruk/bible@${CATALOG_SHA}/json/${id}.json`,
  `https://raw.githubusercontent.com/thiagobodruk/bible/${CATALOG_SHA}/json/${id}.json`,
];
