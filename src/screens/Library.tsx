import { useMemo, useState } from 'react';
import { CheckCircle, CloudArrowDown, CloudCheck, MagnifyingGlass } from '@phosphor-icons/react';
import { ScreenHeader } from '../components/ScreenHeader';
import { VERSIONS, abbrOf, type VersionInfo } from '../data/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { t } from '../strings';

const COVERAGE = { nt: 'Só NT', ot: 'Só AT', partial: 'Incompleta' } as const;

export function Library() {
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

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const map = new Map<string, VersionInfo[]>();
    for (const v of VERSIONS) {
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
  }, [q, names, uiLang]);

  const choose = (id: string) => {
    set('versionId', id);
    notify(`Versão: ${abbrOf(id)}`);
  };

  const get = async (id: string) => {
    if (await download(id)) choose(id);
    else notify(navigator.onLine ? 'Não foi possível baixar. Tente de novo.' : 'Sem conexão. Conecte-se para baixar.');
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
                      aria-label={`${v.name}${active ? ', selecionada' : ''}`}
                    >
                      <div className="nm" dir={v.rtl ? 'rtl' : undefined} style={v.rtl ? { textAlign: 'left' } : undefined}>{v.name}</div>
                      <div className="meta">
                        <span className="abbr">{abbrOf(v.id)}</span>
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
                        <button className="icon-btn" aria-label={`${failed[v.id] ? 'Tentar de novo: ' : 'Baixar '}${v.name}`} onClick={() => get(v.id)}>
                          <CloudArrowDown size={26} weight="light" />
                        </button>
                      ) : active ? (
                        <CheckCircle size={26} weight="fill" aria-label="Em uso" />
                      ) : (
                        <CloudCheck size={26} weight="light" aria-label="Baixada" />
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
        <p className="hint" style={{ marginTop: 24 }}>{VERSIONS.length} versões do repositório thiagobodruk/bible. Cada uma é baixada uma vez e depois funciona sem internet.</p>
      </div>
    </div>
  );
}
