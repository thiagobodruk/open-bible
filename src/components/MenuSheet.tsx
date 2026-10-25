import { useEffect, useSyncExternalStore } from 'react';
import { DeviceMobile, GearSix, ChatCircleText, Notepad, ShareNetwork, SpeakerHigh, Translate, CaretRight, ShieldCheck, SignOut, UserCircle } from '@phosphor-icons/react';
import { accountAvailable, useAccount, warmAccount } from '../state/account';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { useStudy } from '../state/study';
import { go, type Route } from '../router';
import { useT } from '../i18n';
import { appUrl } from '../link';
import { installAvailable, requestInstall, subscribeInstall } from '../install';
import { useChapter } from '../hooks';
import { findVersion } from '../data/catalog';
import { useSettings } from '../state/settings';
import { listenSupported, silentHintDue, start, stop, useListen } from '../listen';

export function MenuSheet() {
  const t = useT();
  const { close, open, notify } = useUI();
  const canInstall = useSyncExternalStore(subscribeInstall, installAvailable);
  const { book, chapter } = useStudy();
  const versionId = useSettings((s) => s.versionId);
  const text = useChapter(book, chapter);
  const listening = useListen((s) => s.status !== 'idle');

  const toggleListen = () => {
    close();
    if (listening) return stop();
    const verses = text.status === 'ready' ? text.verses : [];
    if (!start(verses, findVersion(versionId)?.lang ?? 'en')) notify(t('listenNoVoice'));
    else if (silentHintDue()) notify(t('listenIosHint'));
  };

  const nav = (r: Route) => {
    close();
    go(r);
  };

  const share = async () => {
    const url = appUrl();
    close();
    try {
      if (navigator.share) await navigator.share({ title: 'Open Bible', text: t('shareText'), url });
      else {
        await navigator.clipboard.writeText(url);
        notify(t('linkCopied'));
      }
    } catch (e) {
      // Fechar a folha de compartilhamento do sistema não é erro.
      if (!(e instanceof DOMException && e.name === 'AbortError')) notify(t('linkCopyFailed'));
    }
  };

  const user = useAccount((s) => s.user);
  const canSignIn = accountAvailable() && !user;
  useEffect(() => {
    if (accountAvailable()) void warmAccount().catch(() => undefined);
  }, []);

  const signIn = async () => {
    const result = await useAccount.getState().signIn();
    if (result === 'restored') notify(t('accountRestored'));
    else if (result === 'offline') notify(t('signInOffline'));
    else if (result === 'failed') notify(t('signInFailed'));
  };

  const signOut = () => void useAccount.getState().signOut().catch(() => notify(t('signInFailed')));

  const all = [
    ...(canSignIn ? [{ icon: UserCircle, label: t('signIn'), run: signIn }] : []),
    { icon: Notepad, label: t('study'), run: () => nav('/study') },
    ...(listenSupported() ? [{ icon: SpeakerHigh, label: listening ? t('listenStop') : t('listen'), run: toggleListen }] : []),
    { icon: Translate, label: t('library'), run: () => nav('/library') },
    { icon: GearSix, label: t('settings'), run: () => nav('/settings') },
    { icon: ShareNetwork, label: t('shareApp'), run: share },
    { icon: ChatCircleText, label: t('feedback'), run: () => open('feedback') },
    { icon: ShieldCheck, label: t('privacy'), run: () => nav('/privacy') },
    ...(user ? [{ icon: SignOut, label: t('signOut'), run: signOut }] : []),
    {
      icon: DeviceMobile,
      label: t('install'),
      run: async () => {
        // O prompt nativo vem antes de fechar o menu: fechar mexe no histórico e atrapalharia o prompt.
        if (await requestInstall()) close();
        else open('install');
      },
    },
  ];
  const items = canInstall ? all : all.filter((i) => i.icon !== DeviceMobile);

  return (
    <Sheet title={t('menu')} hideTitle onClose={close}>
      <div className="menu-brand">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <div>
          <b>Open Bible</b>
          <span>{t('tagline')}</span>
        </div>
      </div>
      {user && (
        <div className="menu-account">
          {user.photo ? <img src={user.photo} alt="" referrerPolicy="no-referrer" /> : <UserCircle size={36} weight="light" aria-hidden="true" />}
          <b>{user.name}</b>
        </div>
      )}
      <ul>
        {items.map(({ icon: Icon, label, run }) => (
          <li key={label}>
            <button className="row" onClick={run}>
              <Icon size={26} weight="light" />
              <span className="grow title">{label}</span>
              <CaretRight size={18} weight="light" color="var(--muted)" />
            </button>
          </li>
        ))}
      </ul>
      <p className="menu-version">Open Bible v{__APP_VERSION__}</p>
    </Sheet>
  );
}
