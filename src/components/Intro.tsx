import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenText, GoogleLogo, Sparkle, UserCircle } from '@phosphor-icons/react';
import { accountAvailable, useAccount, warmAccount } from '../state/account';
import { useIntro } from '../state/intro';
import { useUI } from '../state/ui';
import { go } from '../router';
import { DownloadPanel } from './Welcome';
import { useT } from '../i18n';

type Step = 'signin' | 'offline' | 'study' | 'download';

const ICONS = { signin: UserCircle, offline: BookOpenText, study: Sparkle } as const;

/** Primeira abertura, depois da splash: entrar com o Google (ou pular) e três telas de apresentação. */
export function Intro() {
  const t = useT();
  const notify = useUI((s) => s.notify);
  const finish = useIntro((s) => s.finish);
  const user = useAccount((s) => s.user);
  const busy = useAccount((s) => s.busy);
  // Quem já entrou não vê o passo de entrar: ao concluir o login, o mesmo índice passa a apontar para o slide seguinte.
  const steps = useMemo<Step[]>(() => [...(accountAvailable() && !user ? (['signin'] as const) : []), 'offline', 'study', 'download'], [user]);
  const [i, setI] = useState(0);
  const step = steps[i];
  const Icon = step === 'download' ? null : ICONS[step];
  

  useEffect(() => {
    if (accountAvailable()) void warmAccount().catch(() => undefined);
  }, []);

  const next = () => setI((n) => Math.min(n + 1, steps.length - 1));
  const prev = () => setI((n) => Math.max(n - 1, 0));

  // Deslizar ou usar as setas avança e volta entre os slides.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) next();
    else prev();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [steps.length]);

  const signIn = async () => {
    const result = await useAccount.getState().signIn();
    if (result === 'restored') notify(t('accountRestored'));
    else if (result === 'offline') notify(t('signInOffline'));
    else if (result === 'failed') notify(t('signInFailed'));
  };

  const title = { signin: 'signInTitle', offline: 'introOfflineTitle', study: 'introStudyTitle' } as const;
  const body = { signin: 'signInBody', offline: 'introOfflineBody', study: 'introStudyBody' } as const;

  // Escolher outra versão leva à Biblioteca, que fica atrás da apresentação enquanto ela estiver aberta.
  const chooseOther = () => {
    finish();
    go('/library');
  };

  return (
    <main className="intro" aria-label="Open Bible" onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })} onTouchEnd={onTouchEnd}>
      <div className="intro-body" key={step}>
        {step === 'download' || !Icon ? (
          <DownloadPanel iconSize={56} onChooseOther={chooseOther} />
        ) : (
          <>
            <Icon size={56} weight="light" aria-hidden="true" />
            <h1>{t(title[step])}</h1>
            <p>{t(body[step])}</p>
          </>
        )}
      </div>
      <div className="intro-foot">
        <div className="intro-dots" role="img" aria-label={t('introStep', { n: i + 1, total: steps.length })}>
          {steps.map((s, k) => (
            <i key={s} className={k === i ? 'on' : undefined} />
          ))}
        </div>
        {step === 'download' ? null : step === 'signin' ? (
          <button className="btn primary lead" onClick={signIn} disabled={busy}>
            <GoogleLogo size={18} weight="bold" />
            {t('signIn')}
          </button>
        ) : (
          <button className="btn primary" onClick={next}>{t('next')}</button>
        )}
        {step !== 'download' && <button className="btn" onClick={step === 'signin' ? next : finish}>{t('skip')}</button>}
      </div>
    </main>
  );
}
