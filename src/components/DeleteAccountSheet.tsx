import { useState } from 'react';
import { UserMinus } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useAccount } from '../state/account';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

/** Confirma a exclusão da conta. Os dados deste aparelho não são apagados. */
export function DeleteAccountSheet() {
  const t = useT();
  const { close, notify } = useUI();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await useAccount.getState().deleteAccount();
      close();
      notify(t('accountDeleted'));
    } catch {
      setBusy(false);
      notify(t('accountDeleteFailed'));
    }
  };

  return (
    <Sheet title={t('deleteAccount')} icon={UserMinus} onClose={close} compact>
      <p className="hint">{t('deleteAccountBody')}</p>
      <div className="actions">
        <button className="btn grow" onClick={close} disabled={busy}>{t('cancel')}</button>
        <button className="btn danger grow" onClick={confirm} disabled={busy}>{t('deleteAccountConfirm')}</button>
      </div>
    </Sheet>
  );
}
