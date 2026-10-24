import { CloudArrowDown, DownloadSimple, List, Translate } from '@phosphor-icons/react';
import { abbrOf, findVersion, suggestedVersion } from '../data/catalog';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { useIncoming, applyIncoming } from '../state/incoming';
import { go } from '../router';
import { useT } from '../i18n';

/** Primeira abertura: ainda não há nenhuma versão no aparelho. Oferece a sugerida para o idioma e leva à Biblioteca. */
export function Welcome() {
  const t = useT();
  const open = useUI((s) => s.open);
  const uiLang = useSettings((s) => s.uiLang);
  const set = useSettings((s) => s.set);
  const { downloading, failed, download } = useLibrary();
  const incoming = useIncoming((s) => s.incoming);
  const hasOther = useLibrary((s) => Object.keys(s.installed).length > 0);
  const current = useSettings((s) => s.versionId);

  const id = incoming?.versionId ?? suggestedVersion(uiLang);
  const v = findVersion(id)!;
  const progress = downloading[id];
  const busy = progress !== undefined;
  const failure = failed[id];

  const start = async () => {
    set('versionId', id);
    if ((await download(id)) && incoming) applyIncoming();
  };

  return (
    <div className="reader">
      <header className="topbar">
        <div className="topbar-in">
          <b className="brand-name">Open Bible</b>
          <span className="spacer" />
          <button className="icon-btn" onClick={() => open('menu')} aria-label={t('menu')}><List size={24} weight="light" /></button>
        </div>
      </header>
      <main className="page">
        <div className="empty welcome">
          <CloudArrowDown size={44} weight="light" />
          <h1>{t('welcomeTitle')}</h1>
          <p>{t('welcomeBody')}</p>
          <button className="btn primary" onClick={start} disabled={busy}>
            {!busy && <DownloadSimple size={18} weight="regular" />}
            {busy ? t('downloadingBtn', { pct: Math.round(progress * 100) }) : t('downloadBtn', { abbr: abbrOf(id), size: t.mb(v.sizeMb) })}
          </button>
          {busy && <div className="progress" role="progressbar" aria-label={t('downloading')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><i style={{ width: `${progress * 100}%` }} /></div>}
          {failure && (
            <p className="error" role="alert">
              {failure === 'offline' ? t('offlineError') : t('downloadError')}
            </p>
          )}
          {incoming && hasOther && (
            <button className="btn" onClick={() => useIncoming.getState().clear()}>{t('keepCurrent', { abbr: abbrOf(current) })}</button>
          )}
          <button className="btn" onClick={() => go('/library')}><Translate size={18} weight="regular" />{t('chooseOther')}</button>
        </div>
      </main>
    </div>
  );
}
