import { useEffect, useState } from 'react';
import { HandSwipeLeft } from '@phosphor-icons/react';
import { useT } from '../i18n';

/** Dica de gesto da primeira abertura: aparece com fade-in e some com fade-out ao primeiro toque. */
export function SwipeHint({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [leaving, setLeaving] = useState(false);
  const leave = () => setLeaving(true);

  useEffect(() => {
    addEventListener('keydown', leave);
    return () => removeEventListener('keydown', leave);
  }, []);

  return (
    <div
      className={`swipe-hint${leaving ? ' leaving' : ''}`}
      role="status"
      onPointerDown={leave}
      onAnimationEnd={() => leaving && onDone()}
    >
      <HandSwipeLeft className="swipe-icon" size={56} weight="light" aria-hidden="true" />
      <p>{t('hintSwipe')}</p>
    </div>
  );
}
