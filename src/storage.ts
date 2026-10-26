// Acesso seguro ao localStorage: modo privado, cota cheia ou armazenamento bloqueado nunca derrubam o app.

/** Lê um texto. Se o armazenamento falhar, devolve `onError` (por padrão `null`). */
export function getItem(key: string, onError: string | null = null): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return onError;
  }
}

export function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sem persistência: o valor vale só nesta sessão */
  }
}

export function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* sem armazenamento, nada a limpar */
  }
}

/** Lê um JSON. Ausente, inválido ou ilegível devolve `fallback`. */
export function getJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

export function setJson(key: string, value: unknown) {
  setItem(key, JSON.stringify(value));
}
