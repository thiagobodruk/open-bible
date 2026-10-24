import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowsClockwise, ChatCircleText, DeviceMobile, Download, Export, GithubLogo, Trash } from '@phosphor-icons/react';
import { ScreenHeader } from '../components/ScreenHeader';
import { abbrOf, findVersion } from '../data/catalog';
import { downloadedMb, useLibrary } from '../state/library';
import { downloadBackup, parseBackup } from '../backup';
import { useSettings, type UiLang } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { installAvailable, requestInstall, subscribeInstall } from '../install';
import { buildLabel, checkForUpdate, currentBuild, fetchLatestBuild, type BuildInfo } from '../update';
import { useT } from '../i18n';

const LANGS: { code: UiLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja', label: '日本語' },
];

export function Settings() {
  const t = useT();
  const canInstall = useSyncExternalStore(subscribeInstall, installAvailable);
  const { uiLang, set } = useSettings();
  const { installed, remove } = useLibrary();
  const downloaded = Object.keys(installed);
  const fileInput = useRef<HTMLInputElement>(null);
  const { open, notify } = useUI();
  const [checking, setChecking] = useState(false);
  const [latest, setLatest] = useState<BuildInfo | null>(null);
  const newer = latest && latest.build !== currentBuild.build ? latest : null;

  useEffect(() => {
    void fetchLatestBuild().then(setLatest);
  }, []);

  const update = async () => {
    setChecking(true);
    const [r, info] = await Promise.all([checkForUpdate(), fetchLatestBuild()]);
    if (info) setLatest(info);
    setChecking(false);
    notify(t(r === 'updating' ? 'updateFound' : r === 'offline' ? 'updateOffline' : 'updateLatest'));
  };
  const notes = useStudy((s) => s.notes.length);
  const highlights = useStudy((s) => Object.keys(s.highlights).length);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { highlights: hs, notes: ns, skipped } = parseBackup(await file.text());
      await useStudy.getState().merge(hs, ns);
      notify(skipped ? t('importedSkipped', { h: hs.length, n: ns.length, s: skipped }) : t('imported', { h: hs.length, n: ns.length }));
    } catch {
      notify(t('backupInvalid'));
    }
  };

  return (
    <div className="screen">
      <ScreenHeader title={t('settings')} />
      <div className="screen-body">
        <section className="section">
          <h2>{t('uiLanguage')}</h2>
          <select
            className="select"
            value={uiLang}
            aria-label={t('uiLanguage')}
            onChange={(e) => set('uiLang', e.target.value as UiLang)}
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <p className="hint">{t('uiLanguageHint')}</p>
        </section>

        <section className="section">
          <h2>{t('downloadedVersions')}</h2>
          <div className="group">
            {downloaded.map((id) => {
              const v = findVersion(id);
              if (!v) return null;
              return (
                <div key={id} className="row">
                  <span className="grow">
                    <span className="title">{v.name}</span>
                    <span className="sub" style={{ display: 'block' }}>{abbrOf(id)} · {t.mb(v.sizeMb)}</span>
                  </span>
                  <button className="icon-btn" aria-label={t('removeVersion', { name: v.name })} onClick={async () => { await remove(id); notify(t('versionRemoved')); }}>
                    <Trash size={22} weight="light" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="hint">{t('usingMb', { size: t.mb(downloadedMb(downloaded)) })}</p>
        </section>

        <section className="section">
          <h2>{t('yourData')}</h2>
          <div className="group">
            <button className="row" onClick={() => { downloadBackup(); notify(t('backupExported')); }}>
              <Export size={24} weight="light" />
              <span className="grow"><span className="title">{t('exportBackup')}</span><span className="sub" style={{ display: 'block' }}>{t('exportSub', { h: highlights, n: notes })}</span></span>
            </button>
            <button className="row" onClick={() => fileInput.current?.click()}>
              <Download size={24} weight="light" />
              <span className="grow"><span className="title">{t('importBackup')}</span></span>
            </button>
          </div>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
          <p className="hint">{t('dataHint')}</p>
        </section>

        <section className="section">
          <h2>{t('app')}</h2>
          <div className="group">
            {canInstall && (
              <button className="row" onClick={async () => { if (!(await requestInstall())) open('install'); }}>
                <DeviceMobile size={24} weight="light" />
                <span className="grow"><span className="title">{t('install')}</span><span className="sub" style={{ display: 'block' }}>{t('installSub')}</span></span>
              </button>
            )}
            <button className="row" onClick={update} disabled={checking}>
              <ArrowsClockwise size={24} weight="light" />
              <span className="grow"><span className="title">{checking ? t('updateChecking') : t('updateApp')}</span><span className="sub" style={{ display: 'block' }}>{t('updateCurrent', { v: buildLabel(currentBuild) })}</span>
                {newer && <span className="sub" style={{ display: 'block' }}>{t('updateNew', { v: buildLabel(newer) })}</span>}</span>
            </button>
            <button className="row" onClick={() => open('feedback')}>
              <ChatCircleText size={24} weight="light" />
              <span className="grow"><span className="title">{t('feedback')}</span></span>
            </button>
            <a className="row" href="https://github.com/thiagobodruk/open-bible" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              <GithubLogo size={24} weight="light" />
              <span className="grow"><span className="title">{t('github')}</span><span className="sub" style={{ display: 'block' }}>{t('githubSub')}</span></span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
