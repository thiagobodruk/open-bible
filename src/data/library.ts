export interface VersionInfo {
  id: string;
  lang: string; // código ISO, usado com Intl.DisplayNames
  name: string;
  abbr: string;
  sizeMb: number;
  coverage?: 'nt' | 'ot' | 'partial';
  rtl?: boolean;
}

// Amostra do catálogo real (json/index.json do repo thiagobodruk/bible) para validar a interface.
export const VERSIONS: VersionInfo[] = [
  { id: 'en_kjv', lang: 'en', name: 'King James Version', abbr: 'KJV', sizeMb: 4.2 },
  { id: 'en_web', lang: 'en', name: 'World English Bible (American Edition)', abbr: 'WEB', sizeMb: 4.2 },
  { id: 'en_bsb', lang: 'en', name: 'Berean Standard Bible', abbr: 'BSB', sizeMb: 4.0 },
  { id: 'pt_nvi', lang: 'pt', name: 'Nova Versão Internacional', abbr: 'NVI', sizeMb: 4.1 },
  { id: 'pt_acf', lang: 'pt', name: 'Almeida Corrigida e Revisada Fiel', abbr: 'ACF', sizeMb: 4.0 },
  { id: 'pt_ara', lang: 'pt', name: 'Almeida Revista e Atualizada', abbr: 'ARA', sizeMb: 4.0 },
  { id: 'pt_ntlh', lang: 'pt', name: 'Nova Tradução na Linguagem de Hoje', abbr: 'NTLH', sizeMb: 4.3 },
  { id: 'es_rvr1960', lang: 'es', name: 'Reina Valera 1960', abbr: 'RVR60', sizeMb: 4.0 },
  { id: 'fr_apee', lang: 'fr', name: "Le Bible de l'Épée", abbr: 'APEE', sizeMb: 4.4 },
  { id: 'de_sch1951', lang: 'de', name: 'Schlachter 1951', abbr: 'SCH51', sizeMb: 4.3 },
  { id: 'zh_cnvs', lang: 'zh', name: 'New Chinese Version', abbr: 'CNVS', sizeMb: 3.6 },
  { id: 'ja_jniv', lang: 'ja', name: '聖書 新共同訳', abbr: 'JNIV', sizeMb: 5.1 },
  { id: 'ar_kehm', lang: 'ar', name: 'Ketab El Hayat Majani', abbr: 'KEHM', sizeMb: 8.1, rtl: true },
  { id: 'he_wlc', lang: 'he', name: 'Westminster Leningrad Codex', abbr: 'WLC', sizeMb: 5.4, coverage: 'ot', rtl: true },
  { id: 'grc_grctr', lang: 'grc', name: 'Textus Receptus', abbr: 'TR', sizeMb: 1.7, coverage: 'nt' },
  { id: 'ru_synod', lang: 'ru', name: 'Синодальный перевод', abbr: 'SYNOD', sizeMb: 6.1, coverage: 'partial' },
];

export const getVersion = (id: string) => VERSIONS.find((v) => v.id === id) ?? VERSIONS[0];
