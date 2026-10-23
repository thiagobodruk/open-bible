import { ShareNetwork, PlusSquare, DotsThreeVertical } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { isIOS, isStandalone } from '../install';
import { t } from '../strings';

export function InstallSheet() {
  const close = useUI((s) => s.close);
  const ios = isIOS();
  return (
    <Sheet title={t.install} onClose={close}>
      {isStandalone() ? (
        <p>O app já está instalado neste dispositivo.</p>
      ) : ios ? (
        <>
          <p>No iPhone ou iPad, a instalação é feita pelo Safari.</p>
          <ol className="steps">
            <li>Toque em <ShareNetwork size={18} weight="light" style={{ verticalAlign: '-3px' }} /> Compartilhar na barra do Safari.</li>
            <li>Escolha <PlusSquare size={18} weight="light" style={{ verticalAlign: '-3px' }} /> Adicionar à Tela de Início.</li>
            <li>Confirme em Adicionar.</li>
          </ol>
        </>
      ) : (
        <>
          <p>Seu navegador não ofereceu a instalação automática. Você pode instalar pelo menu.</p>
          <ol className="steps">
            <li>Abra o menu <DotsThreeVertical size={18} weight="bold" style={{ verticalAlign: '-3px' }} /> do navegador.</li>
            <li>Escolha Instalar app ou Adicionar à tela inicial.</li>
          </ol>
        </>
      )}
    </Sheet>
  );
}
