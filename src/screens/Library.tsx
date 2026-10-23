import { useMemo, useState } from 'react';
import { CheckCircle, CloudArrowDown, CloudCheck } from '@phosphor-icons/react';
import { SearchField } from '../components/SearchField';
import { ScreenHeader } from '../components/ScreenHeader';
import { VERSIONS, abbrOf, type VersionInfo } from '../data/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

const COVERAGE = { nt: 'covNt', ot: 'covOt', partial: 'covPartial' } as const;

export function Library() {
  const t = useT();
  const [q, setQ] = useState('');
  const { versionId, uiLang, set } = useSettings();
  const { installed, downloading, failed, download } = useLibrary();
  const notify = useUI((s) => s.notify);

  const names = useMemo(() => new Intl.DisplayNames([uiLang], { type: 'language' }), [uiLang]);
  const native = (code: string) => {
    try {
      return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? '';
    } catch {
      return '';
    }
  };

  const matches = (v: VersionInfo) => {
    const term = q.trim().toLowerCase();
    return !term || `${names.of(v.lang) ?? v.lang} ${native(v.lang)} ${v.name} ${abbrOf(v.id)}`.toLowerCase().includes(term);
  };

  // Versões baixadas ficam num grupo próprio, com a que está em uso primeiro.
  const mineIds = new Set(Object.keys(installed));
  const mine = VERSIONS.filter((v) => mineIds.has(v.id) && matches(v)).sort(
    (a, b) => Number(b.id === versionId) - Number(a.id === versionId) || a.name.localeCompare(b.name),
  );

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<string, VersionInfo[]>();
    for (const v of VERSIONS) {
      if (installed[v.id]) continue;
      const label = `${names.of(v.lang) ?? v.lang} ${native(v.lang)} ${v.name} ${abbrOf(v.id)}`.toLowerCase();
      if (term && !label.includes(term)) continue;
      map.set(v.lang, [...(map.get(v.lang) ?? []), v]);
    }
    // Primeiro o idioma escolhido pelo usuário (por padrão, o do navegador), depois os demais idiomas do navegador
    // e, por fim, o resto em ordem alfabética pelo nome localizado.
    const prefs = [uiLang, ...(navigator.languages ?? [])].map((l) => l.toLowerCase().split('-')[0]);
    const rank = (code: string) => {
      const i = prefs.indexOf(code);
      return i < 0 ? prefs.length : i;
    };
    const collator = new Intl.Collator(uiLang);
    return [...map.entries()].sort(
      ([a], [b]) => rank(a) - rank(b) || collator.compare(names.of(a) ?? a, names.of(b) ?? b),
    );
  }, [q, names, uiLang, installed]);

  const choose = (id: string) => {
    set('versionId', id);
    notify(t('versionToast', { abbr: abbrOf(id) }));
  };

  const get = async (id: string) => {
    if (await download(id)) choose(id);
    else notify(navigator.onLine ? t('downloadError') : t('offlineShort'));
  };

  const renderRow = (v: VersionInfo) => {
      const isDown = !!installed[v.id];
      const prog = downloading[v.id];
      const active = v.id === versionId;
      return (
        <div key={v.id} className={`ver ${active ? 'active' : ''}`}>
          <button
            className="grow"
            style={{ textAlign: 'left', minWidth: 0 }}
            disabled={!isDown}
            onClick={() => choose(v.id)}
            aria-label={`${v.name}${active ? `, ${t('selected')}` : ''}`}
          >
            <div className="nm" dir={v.rtl ? 'rtl' : undefined} style={v.rtl ? { textAlign: 'left' } : undefined}>{v.name}</div>
            <div className="meta">
              <span className="abbr">{abbrOf(v.id)}</span>
            {mineIds.has(v.id) && <span className="chip">{names.of(v.lang) ?? v.lang}</span>}
              {v.coverage && <span className="chip">{t(COVERAGE[v.coverage])}</span>}
              {v.rtl && <span className="chip">RTL</span>}
              {active ? <span className="chip accent">{t('inUse')}</span> : isDown && <span className="chip">{t('downloaded')}</span>}
              <span className="abbr" style={{ fontWeight: 400 }}>{v.sizeMb.toFixed(1)} MB</span>
            </div>
          </button>
          <div className="state">
            {prog !== undefined ? (
              <div className="progress" role="progressbar" aria-label={t('downloading')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(prog * 100)}><i style={{ width: `${prog * 100}%` }} /></div>
            ) : !isDown ? (
              <button className="icon-btn" aria-label={failed[v.id] ? t('retryDownload', { name: v.name }) : t('downloadVersion', { name: v.name })} onClick={() => get(v.id)}>
                <CloudArrowDown size={26} weight="light" />
              </button>
            ) : active ? (
              <CheckCircle size={26} weight="fill" aria-label={t('inUse')} />
            ) : (
              <CloudCheck size={26} weight="light" aria-label={t('downloaded')} />
            )}
          </div>
        </div>
      );
  };

  return (
    <div className="screen">
      <ScreenHeader title={t('library')} />
      <div className="screen-body">
        <div className="search-sticky">
          <SearchField value={q} onChange={setQ} placeholder={t('searchLibrary')} aria-label={t('searchLibrary')} />
        </div>

        {mine.length === 0 && groups.length === 0 && <p className="empty">{t('noVersions')}</p>}

        {mine.length > 0 && (
          <section>
            <h2 className="lang-title">{t('myVersions')}</h2>
            {mine.map(renderRow)}
          </section>
        )}

        {groups.map(([lang, versions]) => {
          const nat = native(lang);
          const loc = names.of(lang) ?? lang;
          return (
            <section key={lang}>
              <h2 className="lang-title">
                {loc}
                {nat && nat !== loc && <small>{nat}</small>}
              </h2>
              {versions.map(renderRow)}
            </section>
          );
        })}
        <p className="hint" style={{ marginTop: 24 }}>{t('libraryFooter', { n: VERSIONS.length })}</p>
      </div>
    </div>
  );
}
