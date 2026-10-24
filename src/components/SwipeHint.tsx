import { useEffect, useState } from 'react';
import { HandSwipeLeft, HandTap } from '@phosphor-icons/react';
import { useAsk } from '../state/ask';
import { useT } from '../i18n';

const SWIPE_MS = 4400; // duas voltas do gesto

/**
 * Dicas da primeira abertura. Primeiro mostra o gesto de paginar; depois, com a IA ativa, aponta para o botão
 * flutuante e espera o toque nele. Cada passo entra e sai com fade; tocar fora ou abrir o prompt encerra.
 */
export function SwipeHint({ onDone, withAi }: { onDone: () => void; withAi: boolean }) {
  const t = useT();
  const [step, setStep] = useState<'swipe' | 'ai'>('swipe');
  const [leaving, setLeaving] = useState(false);
  const askOpen = useAsk((s) => s.bar);

  const next = () => (withAi && step === 'swipe' ? setStep('ai') : setLeaving(true));

  useEffect(() => {
    if (step !== 'swipe') return;
    const id = setTimeout(next, SWIPE_MS);
    return () => clearTimeout(id);
  });

  useEffect(() => {
    addEventListener('keydown', next);
    return () => removeEventListener('keydown', next);
  });

  useEffect(() => {
    if (askOpen) setLeaving(true);
  }, [askOpen]);

  return (
    <div
      className={`swipe-hint${step === 'ai' ? ' ai' : ''}${leaving ? ' leaving' : ''}`}
      role="status"
      onPointerDown={next}
      onAnimationEnd={(e) => leaving && e.target === e.currentTarget && onDone()}
    >
      {step === 'swipe' ? (
        <div className="hint-step" key="swipe">
          <HandSwipeLeft className="swipe-icon" size={56} weight="light" aria-hidden="true" />
          <p>{t('hintSwipe')}</p>
        </div>
      ) : (
        <div className="hint-step hint-ai" key="ai">
          <HandTap className="tap-icon" size={48} weight="light" aria-hidden="true" />
          <p>{t('hintAsk')}</p>
        </div>
      )}
    </div>
  );
}
