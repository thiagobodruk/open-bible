const KEY = 'ob:hint-pager';

/** O aviso de gestos aparece uma única vez. Sem armazenamento disponível, não aparece, para não repetir a cada abertura. */
export function hintPending(): boolean {
  try {
    return !localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function markHintSeen() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignora */
  }
}
