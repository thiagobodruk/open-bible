import { useEffect } from 'react';
import { Export, PlusSquare, DotsThreeVertical } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { detectIOS, dismissInstall, isInstalled } from '../install';
import { splitIcon, useT } from '../i18n';

function WithIcon({ text, icon }: { text: string; icon: React.ReactNode }) {
  const [a, b] = splitIcon(text);
  return <>{a}{icon}{b}</>;
}

export function InstallSheet() {
  const t = useT();
  // Quem abre o guia já sabe como instalar: o banner não precisa mais aparecer.
  useEffect(() => dismissInstall(), []);
  const close = useUI((s) => s.close);
  const ios = detectIOS();
  const shareKey = !ios ? null : ios.browser === 'chrome' ? 'installShareChrome' : ios.browser === 'safari' ? (ios.device === 'iPad' ? 'installShareSafariPad' : 'installShareSafariPhone') : 'installShareOther';
  return (
    <Sheet title={t('install')} onClose={close}>
      {isInstalled() ? (
        <p>{t('installedAlready')}</p>
      ) : ios ? (
        <>
          <p>{t('installIosIntro', { device: ios.device })}</p>
          <ol className="steps">
            <li><WithIcon text={t(shareKey!)} icon={<Export size={18} weight="light" style={{ verticalAlign: '-3px' }} />} /></li>
            <li><WithIcon text={t('installIosStep2')} icon={<PlusSquare size={18} weight="light" style={{ verticalAlign: '-3px' }} />} /></li>
            <li>{t('installIosStep3')}</li>
          </ol>
        </>
      ) : (
        <>
          <p>{t('installOtherIntro')}</p>
          <ol className="steps">
            <li><WithIcon text={t('installOtherStep1')} icon={<DotsThreeVertical size={18} weight="bold" style={{ verticalAlign: '-3px' }} />} /></li>
            <li>{t('installOtherStep2')}</li>
          </ol>
        </>
      )}
    </Sheet>
  );
}
