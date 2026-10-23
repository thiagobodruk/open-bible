import { useEffect, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { t } from '../strings';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  leading?: ReactNode;
  tall?: boolean;
}

export function Sheet({ title, onClose, children, leading, tall }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={`sheet${tall ? ' tall' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            {leading}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t.close}>
            <X size={22} weight="light" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}
