import { useState } from 'react';
import { SpeakerSlash } from '@phosphor-icons/react';
import { useT } from '../i18n';

/**
 * Aviso do modo silencioso no iOS, mostrado na primeira vez que o usuário pede para ouvir.
 * O toque fecha o aviso e inicia a leitura no mesmo gesto, que o iOS exige para liberar o áudio.
 */
export function SilentHint({ onConfirm, onDone }: { onConfirm: () => void; onDone: () => void }) {
  const t = useT();
  const [leaving, setLeaving] = useState(false);

  const confirm = () => {
    if (leaving) return;
    setLeaving(true);
    onConfirm();
  };

  return (
    <div
      className={`swipe-hint${leaving ? ' leaving' : ''}`}
      role="status"
      onPointerDown={confirm}
      onAnimationEnd={(e) => leaving && e.target === e.currentTarget && onDone()}
    >
      <div className="hint-step">
        <SpeakerSlash size={56} weight="light" aria-hidden="true" />
        <p>{t('listenIosHint')}</p>
      </div>
    </div>
  );
}
