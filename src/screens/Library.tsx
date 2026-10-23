import { useMemo, useState } from 'react';
import { CloudArrowDown, MagnifyingGlass } from '@phosphor-icons/react';
import { ScreenHeader } from '../components/ScreenHeader';
import { VERSIONS } from '../data/library';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { t } from '../strings';

const COVERAGE = { nt: 'Só NT', ot: 'Só AT', partial: 'Incompleta' } as const;

export function Library() {
  const [q, setQ] = useState('');
  const { versionId, uiLang, set } = useSettings();
  const { downloaded, downloading, download } = useLibrary();
  const notify = useUI((s) => s.notify);

  const names = useMemo(() => new Intl.DisplayNames([uiLang], { type: 'language' }), [uiLang]);
  const native = (code: string) => {
    try {
      return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? '';
    } catch {
      return '';
    }
  };

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<string, typeof VERSIONS>();
    for (const v of VERSIONS) {
      const label = `${names.of(v.lang) ?? v.lang} ${native(v.lang)} ${v.name} ${v.abbr}`.toLowerCase();
      if (term && !label.includes(term)) continue;
      map.set(v.lang, [...(map.get(v.lang) ?? []), v]);
    }
    return [...map.entries()];
  }, [q, names]);

  const choose = (id: string, abbr: string) => {
    set('versionId', id);
    notify(`Versão: ${abbr}`);
  };

  return (
    <div className="screen">
      <ScreenHeader title={t.library} />
      <div className="screen-body">
        <label className="search">
          <MagnifyingGlass size={20} weight="light" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar idioma ou versão" aria-label="Buscar idioma ou versão" />
        </label>

        {groups.length === 0 && <p className="empty">Nenhuma versão encontrada.</p>}

        {groups.map(([lang, versions]) => {
          const nat = native(lang);
          const loc = names.of(lang) ?? lang;
          return (
            <section key={lang}>
              <h2 className="lang-title">
                {loc}
                {nat && nat !== loc && <small>{nat}</small>}
              </h2>
              {versions.map((v) => {
                const isDown = downloaded.includes(v.id);
                const prog = downloading[v.id];
                const active = v.id === versionId;
                return (
                  <div key={v.id} className={`ver ${active ? 'active' : ''}`}>
                    <button
                      className="grow"
                      style={{ textAlign: 'left', minWidth: 0 }}
                      disabled={!isDown}
                      onClick={() => choose(v.id, v.abbr)}
                      aria-label={`${v.name}${active ? ', selecionada' : ''}`}
                    >
                      <div className="nm" dir={v.rtl ? 'rtl' : undefined} style={v.rtl ? { textAlign: 'left' } : undefined}>{v.name}</div>
                      <div className="meta">
                        <span className="abbr">{v.abbr}</span>
                        {v.coverage && <span className="chip">{COVERAGE[v.coverage]}</span>}
                        {v.rtl && <span className="chip">RTL</span>}
                        {active ? <span className="chip accent">Em uso</span> : isDown && <span className="chip">Baixada</span>}
                        <span className="abbr" style={{ fontWeight: 400 }}>{v.sizeMb.toFixed(1)} MB</span>
                      </div>
                    </button>
                    <div className="state">
                      {prog !== undefined ? (
                        <div className="progress" role="progressbar" aria-valuenow={Math.round(prog * 100)}><i style={{ width: `${prog * 100}%` }} /></div>
                      ) : !isDown ? (
                        <button className="icon-btn" aria-label={`Baixar ${v.name}`} onClick={() => download(v.id, () => choose(v.id, v.abbr))}>
                          <CloudArrowDown size={26} weight="light" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
        <p className="hint" style={{ marginTop: 24 }}>Amostra do catálogo, só para validar a interface. O download é simulado.</p>
      </div>
    </div>
  );
}
