import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, GoogleLogo, Sparkle, Translate, UserCircle } from '@phosphor-icons/react';
import { accountAvailable, useAccount, warmAccount } from '../state/account';
import { useIntro } from '../state/intro';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

type Step = 'signin' | 'offline' | 'study' | 'version';

const ICONS = { signin: UserCircle, offline: BookOpenText, study: Sparkle, version: Translate } as const;

/** Primeira abertura, depois da splash: entrar com o Google (ou pular) e três telas de apresentação. */
export function Intro() {
  const t = useT();
  const notify = useUI((s) => s.notify);
  const finish = useIntro((s) => s.finish);
  const user = useAccount((s) => s.user);
  const busy = useAccount((s) => s.busy);
  const steps = useMemo<Step[]>(() => [...(accountAvailable() ? (['signin'] as const) : []), 'offline', 'study', 'version'], []);
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;
  const Icon = ICONS[step];

  useEffect(() => {
    if (accountAvailable()) void warmAccount().catch(() => undefined);
  }, []);

  // Quem já entrou (ou voltou do login por redirecionamento) segue direto para a apresentação.
  useEffect(() => {
    if (step === 'signin' && user) setI((n) => n + 1);
  }, [step, user]);

  const next = () => setI((n) => n + 1);

  const signIn = async () => {
    const result = await useAccount.getState().signIn();
    if (result === 'restored') notify(t('accountRestored'));
    else if (result === 'offline') notify(t('signInOffline'));
    else if (result === 'failed') notify(t('signInFailed'));
  };

  const title = { signin: 'signInTitle', offline: 'introOfflineTitle', study: 'introStudyTitle', version: 'introVersionTitle' } as const;
  const body = { signin: 'signInBody', offline: 'introOfflineBody', study: 'introStudyBody', version: 'introVersionBody' } as const;

  return (
    <main className="intro" aria-label="Open Bible">
      <div className="intro-body" key={step}>
        <Icon size={56} weight="light" aria-hidden="true" />
        <h1>{t(title[step])}</h1>
        <p>{t(body[step])}</p>
      </div>
      <div className="intro-foot">
        <div className="intro-dots" role="img" aria-label={t('introStep', { n: i + 1, total: steps.length })}>
          {steps.map((s, k) => (
            <i key={s} className={k === i ? 'on' : undefined} />
          ))}
        </div>
        {step === 'signin' ? (
          <button className="btn primary lead" onClick={signIn} disabled={busy}>
            <GoogleLogo size={18} weight="bold" />
            {t('signIn')}
          </button>
        ) : (
          <button className="btn primary" onClick={last ? finish : next}>{last ? t('introStart') : t('next')}</button>
        )}
        {!last && <button className="btn" onClick={step === 'signin' ? next : finish}>{t('skip')}</button>}
      </div>
    </main>
  );
}
