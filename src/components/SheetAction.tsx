import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';

/** Botão de ação da folha de seleção: ícone grande e rótulo curto embaixo. */
export function SheetAction({ icon: Glyph, onClick, children }: { icon: Icon; onClick: () => void; children: ReactNode }) {
  return (
    <button className="sheet-action" onClick={onClick}>
      <Glyph size={24} weight="light" />
      {children}
    </button>
  );
}
