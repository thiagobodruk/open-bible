import { useEffect, useState, useSyncExternalStore } from 'react';
import { DeviceMobile, X } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { useUI } from '../state/ui';
import { canPromptInstall, dismissInstall, installOffered, isIOS, requestInstall, subscribeInstall } from '../install';
import { Button } from './Button';

/** Convite discreto para instalar o app. Aparece depois do primeiro download, sem cobrir a leitura. */
export function InstallBanner({ hidden, hold = false }: { hidden: boolean; hold?: boolean }) {
  const t = useT();
  const open = useUI((s) => s.open);
  const prompt = useSyncExternalStore(subscribeInstall, canPromptInstall);
  const offered = useSyncExternalStore(subscribeInstall, installOffered);
  const [ready, setReady] = useState(false);

  // Espera a dica de gesto sair e mais um pouco, para não disputar a atenção com ela.
  useEffect(() => {
    if (hold) return;
    const id = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(id);
  }, [hold]);

  if (!offered || hidden || !ready || !(prompt || isIOS())) return null;

  return (
    <div className="install-banner" role="region" aria-label={t('install')}>
      <DeviceMobile size={26} weight="light" />
      <span className="grow">{t('installBanner')}</span>
      <Button
        variant="primary"
        size="sm"
        onClick={async () => {
          if (!(await requestInstall())) open('install');
        }}
      >
        {t('installBannerAction')}
      </Button>
      <button className="icon-btn" aria-label={t('dismiss')} onClick={dismissInstall}>
        <X size={20} weight="light" />
      </button>
    </div>
  );
}
