import { useEffect, useState, useSyncExternalStore } from 'react';
import { DeviceMobile, X } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { useUI } from '../state/ui';
import { canPromptInstall, dismissInstall, installOffered, isIOS, requestInstall, subscribeInstall } from '../install';

/** Convite discreto para instalar o app. Aparece depois do primeiro download, sem cobrir a leitura. */
export function InstallBanner({ hidden }: { hidden: boolean }) {
  const t = useT();
  const open = useUI((s) => s.open);
  const prompt = useSyncExternalStore(subscribeInstall, canPromptInstall);
  const offered = useSyncExternalStore(subscribeInstall, installOffered);
  const [ready, setReady] = useState(false);

  // Espera um pouco, para não disputar a atenção com a dica de gestos.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(id);
  }, []);

  if (!offered || hidden || !ready || !(prompt || isIOS())) return null;

  return (
    <div className="install-banner" role="region" aria-label={t('install')}>
      <DeviceMobile size={26} weight="light" />
      <span className="grow">{t('installBanner')}</span>
      <button
        className="btn primary sm"
        onClick={async () => {
          if (!(await requestInstall())) open('install');
        }}
      >
        {t('installBannerAction')}
      </button>
      <button className="icon-btn" aria-label={t('dismiss')} onClick={dismissInstall}>
        <X size={20} weight="light" />
      </button>
    </div>
  );
}
