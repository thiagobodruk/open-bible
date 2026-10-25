import { Trash, X, type Icon } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useT } from '../i18n';
import { Button } from './Button';

interface Props {
  title: string;
  text: string;
  /** Rótulo do botão de confirmar. */
  confirmLabel: string;
  /** Ícone do título e do botão de confirmar. */
  icon?: Icon;
  /** Desabilita os botões enquanto a ação roda. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação de ação sem volta: texto, Cancelar e a ação principal. É o único padrão para excluir no app. */
export function ConfirmSheet({ title, text, confirmLabel, icon: Icon = Trash, busy, onConfirm, onCancel }: Props) {
  const t = useT();
  return (
    <Sheet title={title} icon={Icon} onClose={onCancel}>
      <p className="confirm-text">{text}</p>
      <div className="actions">
        <span className="grow" />
        <Button icon={X} onClick={onCancel} disabled={busy}>{t('cancel')}</Button>
        <Button variant="primary" icon={Icon} onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </div>
    </Sheet>
  );
}
