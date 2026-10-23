import { CloudArrowDown, List, Translate } from '@phosphor-icons/react';
import { abbrOf, findVersion, suggestedVersion } from '../data/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { go } from '../router';
import { t } from '../strings';

/** Primeira abertura: ainda não há nenhuma versão no aparelho. Oferece a sugerida para o idioma e leva à Biblioteca. */
export function Welcome() {
  const open = useUI((s) => s.open);
  const uiLang = useSettings((s) => s.uiLang);
  const set = useSettings((s) => s.set);
  const { downloading, failed, download } = useLibrary();

  const id = suggestedVersion(uiLang);
  const v = findVersion(id)!;
  const progress = downloading[id];
  const busy = progress !== undefined;
  const failure = failed[id];

  const start = async () => {
    set('versionId', id);
    await download(id);
  };

  return (
    <div className="reader">
      <header className="topbar">
        <div className="topbar-in">
          <b className="brand-name">{t.appName}</b>
          <span className="spacer" />
          <button className="icon-btn" onClick={() => open('menu')} aria-label={t.menu}><List size={24} weight="light" /></button>
        </div>
      </header>
      <main className="page">
        <div className="empty welcome">
          <CloudArrowDown size={44} weight="light" />
          <h1>Baixe uma Bíblia para começar</h1>
          <p>O texto fica salvo neste aparelho e depois funciona sem internet. Nada é enviado para servidor algum.</p>
          <button className="btn primary" onClick={start} disabled={busy}>
            {busy ? `Baixando… ${Math.round(progress * 100)}%` : `Baixar ${abbrOf(id)} · ${v.sizeMb.toFixed(1)} MB`}
          </button>
          {busy && <div className="progress" role="progressbar" aria-label="Baixando" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div>}
          {failure && (
            <p className="error" role="alert">
              {failure === 'offline' ? 'Sem conexão. Conecte-se à internet para baixar.' : 'Não foi possível baixar. Tente de novo.'}
            </p>
          )}
          <button className="btn" onClick={() => go('/library')}><Translate size={18} weight="light" /> Escolher outra versão</button>
        </div>
      </main>
    </div>
  );
}
