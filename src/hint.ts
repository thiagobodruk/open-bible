import { getItem, setItem } from './storage';

const KEY = 'ob:hint-pager';

/** O aviso de gestos aparece uma única vez. Sem armazenamento disponível, não aparece, para não repetir a cada abertura. */
export function hintPending(): boolean {
  return !getItem(KEY, '1');
}

export function markHintSeen() {
  setItem(KEY, '1');
}
