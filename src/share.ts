// Copiar e compartilhar com o que o aparelho oferecer.

/** Copia para a área de transferência. Devolve `false` se o navegador negar. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Abre a folha de compartilhamento do sistema. Sem ela, copia o link (ou o texto).
 * Fechar a folha sem escolher nada é `cancelled`, não erro.
 */
export async function shareOrCopy(data: { title?: string; text?: string; url?: string }): Promise<ShareResult> {
  if (!navigator.share) return (await copyText(data.url ?? data.text ?? '')) ? 'copied' : 'failed';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
