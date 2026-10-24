import { Sparkle } from '@phosphor-icons/react';
import { useAsk } from '../state/ask';
import { useT } from '../i18n';

/** Botão flutuante que abre o prompt de IA. Volta quando o sheet fecha. */
export function AskFab() {
  const t = useT();
  return (
    <button className="ask-fab" onClick={() => useAsk.getState().openBar()} aria-label={t('ask')}>
      <Sparkle size={26} weight="regular" />
    </button>
  );
}
