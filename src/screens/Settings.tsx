import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowsClockwise, ChatCircleText, DeviceMobile, Download, Export, FileText, GithubLogo, ShieldCheck, Trash, UserMinus } from '@phosphor-icons/react';
import { ScreenHeader } from '../components/ScreenHeader';
import { abbrOf, findVersion } from '../data/catalog';
import { downloadedMb, useLibrary } from '../state/library';
import { downloadBackup, parseBackup } from '../backup';
import { useSettings, type UiLang } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { installAvailable, requestInstall, subscribeInstall } from '../install';
import { buildLabel, checkForUpdate, currentBuild, fetchLatestBuild, type BuildInfo } from '../update';
import { go } from '../router';
import { useAccount } from '../state/account';
import { analyticsAvailable, useAnalytics } from '../analytics';
import { Segmented } from '../components/Segmented';
import { useT } from '../i18n';
import { Row } from '../components/Row';
import { Section } from '../components/Section';

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
  const account = useAccount((s) => s.user);
  const consent = useAnalytics((s) => s.consent);
  const setConsent = useAnalytics((s) => s.setConsent);
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
        <Section title={t('uiLanguage')}>
          <select
            className="select"
            value={uiLang}
            aria-label={t('uiLanguage')}
            onChange={(e) => set('uiLang', e.target.value as UiLang)}
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <p className="hint">{t('uiLanguageHint')}</p>
        </Section>

        <Section title={t('downloadedVersions')}>
          <div className="group">
            {downloaded.map((id) => {
              const v = findVersion(id);
              if (!v) return null;
              return (
                <Row
                  key={id}
                  as="div"
                  title={v.name}
                  sub={`${abbrOf(id)} · ${t.mb(v.sizeMb)}`}
                  end={
                    <button className="icon-btn" aria-label={t('removeVersion', { name: v.name })} onClick={async () => { await remove(id); notify(t('versionRemoved')); }}>
                      <Trash size={22} weight="light" />
                    </button>
                  }
                />
              );
            })}
          </div>
          <p className="hint">{t('usingMb', { size: t.mb(downloadedMb(downloaded)) })}</p>
        </Section>

        <Section title={t('yourData')}>
          <div className="group">
            <Row icon={Export} title={t('exportBackup')} sub={t('exportSub', { h: highlights, n: notes })} onClick={() => { downloadBackup(); notify(t('backupExported')); }} />
            <Row icon={Download} title={t('importBackup')} onClick={() => fileInput.current?.click()} />
          </div>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
          <p className="hint">{t(account ? 'dataHintSynced' : 'dataHint')}</p>
        </Section>

        {analyticsAvailable() && (
          <Section title={t('statsTitle')}>
            <Segmented
              label={t('statsTitle')}
              value={consent === 'granted' ? 'on' : 'off'}
              options={[{ value: 'on', label: t('on') }, { value: 'off', label: t('off') }]}
              onChange={(v) => setConsent(v === 'on')}
            />
            <p className="hint">{t('statsHint')}</p>
          </Section>
        )}

        <Section title={t('app')}>
          <div className="group">
            {canInstall && (
              <Row icon={DeviceMobile} title={t('install')} sub={t('installSub')} onClick={async () => { if (!(await requestInstall())) open('install'); }} />
            )}
            <Row
              icon={ArrowsClockwise}
              title={checking ? t('updateChecking') : t('updateApp')}
              sub={[t('updateCurrent', { v: buildLabel(currentBuild) }), newer && t('updateNew', { v: buildLabel(newer) })]}
              onClick={update}
              disabled={checking}
            />
            <Row icon={ChatCircleText} title={t('feedback')} onClick={() => open('feedback')} />
            <Row icon={FileText} title={t('terms')} onClick={() => go('/terms')} />
            <Row icon={ShieldCheck} title={t('privacy')} onClick={() => go('/privacy')} />
            <Row as="a" icon={GithubLogo} title={t('github')} sub={t('githubSub')} href="https://github.com/thiagobodruk/open-bible" target="_blank" rel="noreferrer" />
          </div>
        </Section>

        {account && (
          <Section title={t('account')}>
            <div className="group">
              <Row icon={UserMinus} danger title={t('deleteAccount')} sub={t('deleteAccountSub')} onClick={() => open('deleteAccount')} />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
