import { useState } from 'react';
import { UserMinus } from '@phosphor-icons/react';
import { ConfirmSheet } from './ConfirmSheet';
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

  return <ConfirmSheet title={t('deleteAccount')} text={t('deleteAccountBody')} confirmLabel={t('deleteAccountConfirm')} icon={UserMinus} busy={busy} onConfirm={confirm} onCancel={close} />;
}
