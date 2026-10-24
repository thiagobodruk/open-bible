import { useEffect, useRef, type ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';

interface Props {
  title: string;
  /** Ícone ao lado do título. */
  icon?: Icon;
  /** Mantém o título só para leitores de tela. */
  hideTitle?: boolean;
  onClose: () => void;
  children: ReactNode;
  leading?: ReactNode;
  /** Ação no canto direito do cabeçalho. */
  trailing?: ReactNode;
  tall?: boolean;
  /** Conteúdo fixo entre o título e a área rolável. */
  pinned?: ReactNode;
  /** Conteúdo fixo no rodapé, abaixo da área rolável. */
  footer?: ReactNode;
  /** Sem fundo escurecido e sem tomar o foco: a página atrás continua tocável. */
  modeless?: boolean;
}

const CLOSE_DISTANCE = 110; // px arrastados para fechar
const CLOSE_VELOCITY = 0.6; // px/ms
const ANIM = 180;

/** Bottom sheet padrão. Fecha ao arrastar para baixo, tocar fora (se houver fundo) ou com Esc. Não tem botão ×. */
export function Sheet({ title, icon: HeadIcon, hideTitle, onClose, children, leading, trailing, tall, pinned, footer, modeless }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    if (!modeless) ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      if (!modeless) prev?.focus?.();
    };
  }, [modeless]);

  // Arrastar para baixo: toque em qualquer ponto (se o conteúdo estiver no topo) e mouse pelo cabeçalho.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let armed = false;
    let dragging = false;
    let fromBody = false;

    const setDy = (dy: number) => el.style.setProperty('--dy', `${dy}px`);
    const finish = (dy: number) => {
      el.classList.remove('dragging');
      if (dy > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
        el.classList.add('leaving');
        setDy(el.offsetHeight + 40);
        setTimeout(() => close.current(), ANIM);
      } else {
        setDy(0);
      }
    };

    const begin = (y: number, target: EventTarget | null) => {
      const t = target as HTMLElement | null;
      if (t?.closest('input, textarea, select')) return false;
      fromBody = !!body.current?.contains(t);
      startY = lastY = y;
      lastT = performance.now();
      velocity = 0;
      armed = true;
      dragging = false;
      return true;
    };
    const move = (y: number, e: Event) => {
      if (!armed) return;
      const dy = y - startY;
      if (!dragging) {
        if (dy > 8 && (!fromBody || (body.current?.scrollTop ?? 0) <= 0)) {
          dragging = true;
          el.classList.add('dragging');
        } else {
          if (dy < -8) armed = false;
          return;
        }
      }
      e.cancelable && e.preventDefault();
      const now = performance.now();
      velocity = (y - lastY) / Math.max(1, now - lastT);
      lastY = y;
      lastT = now;
      setDy(Math.max(0, dy));
    };
    const end = (y: number) => {
      if (armed && dragging) finish(Math.max(0, y - startY));
      armed = dragging = false;
    };

    const ts = (e: TouchEvent) => begin(e.touches[0].clientY, e.target);
    const tm = (e: TouchEvent) => move(e.touches[0].clientY, e);
    const te = (e: TouchEvent) => end(e.changedTouches[0].clientY);
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te);
    el.addEventListener('touchcancel', te);

    // Mouse (desktop): só pelo cabeçalho.
    const md = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (e.pointerType !== 'mouse' || !t.closest('.sheet-grip, .sheet-head') || t.closest('button, a')) return;
      if (begin(e.clientY, e.target)) el.setPointerCapture(e.pointerId);
    };
    const mm = (e: PointerEvent) => e.pointerType === 'mouse' && move(e.clientY, e);
    const mu = (e: PointerEvent) => e.pointerType === 'mouse' && end(e.clientY);
    el.addEventListener('pointerdown', md);
    el.addEventListener('pointermove', mm);
    el.addEventListener('pointerup', mu);

    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', te);
      el.removeEventListener('touchcancel', te);
      el.removeEventListener('pointerdown', md);
      el.removeEventListener('pointermove', mm);
      el.removeEventListener('pointerup', mu);
    };
  }, []);

  return (
    <>
      {!modeless && <div className="scrim" onClick={onClose} />}
      <div
        className={`sheet${tall ? ' tall' : ''}${modeless ? ' modeless' : ''}`}
        role="dialog"
        aria-modal={!modeless}
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="sheet-grip" />
        <div className="sheet-head">
          {leading}
          {!hideTitle && (
            <h2>
              {HeadIcon && <HeadIcon size={22} weight="light" aria-hidden="true" />}
              {title}
            </h2>
          )}
          {trailing && <div className="sheet-trailing">{trailing}</div>}
        </div>
        {pinned && <div className="sheet-pinned">{pinned}</div>}
        <div className="sheet-body" ref={body}>{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  );
}
