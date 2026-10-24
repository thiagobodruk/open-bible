/** Cliente do Worker de IA (worker/). Sem VITE_AI_URL no build, o recurso fica desligado. */
export const AI_URL: string = import.meta.env.VITE_AI_URL ?? '';
export const aiEnabled = AI_URL.length > 0;

export interface AiPassage {
  ref: string;
  version: string;
  text: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** limit: muitas perguntas em um minuto. daily: o limite do dia deste aparelho. busy: a cota do serviço acabou. */
export type AiErrorKind = 'offline' | 'limit' | 'daily' | 'busy' | 'failed';

export class AiError extends Error {
  constructor(public kind: AiErrorKind) {
    super(kind);
  }
}

const CONSENT = 'ob:ai-consent';

/** O aviso de que a pergunta e o trecho vão para um serviço de IA aparece até o usuário aceitar. */
export function consented(): boolean {
  try {
    return localStorage.getItem(CONSENT) === '1';
  } catch {
    return false;
  }
}

export function setConsented() {
  try {
    localStorage.setItem(CONSENT, '1');
  } catch {
    /* sem armazenamento: o aviso volta na próxima vez */
  }
}

interface Request {
  question: string;
  passage: AiPassage;
  lang: string;
  history: AiMessage[];
  signal: AbortSignal;
  onText: (chunk: string) => void;
}

/** Envia a pergunta e entrega a resposta aos poucos, lendo o fluxo de eventos no formato OpenAI. */
export async function askAI({ question, passage, lang, history, signal, onText }: Request): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${AI_URL.replace(/\/$/, '')}/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, passage, lang, history }),
      signal,
    });
  } catch {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    throw new AiError(navigator.onLine === false ? 'offline' : 'failed');
  }
  if (!res.ok || !res.body) {
    if (res.status !== 429) throw new AiError('failed');
    const code = await res.json().then((j) => j?.error, () => undefined);
    throw new AiError(code === 'daily_limit' ? 'daily' : code === 'quota' ? 'busy' : 'limit');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let got = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const piece = JSON.parse(data).choices?.[0]?.delta?.content;
          if (typeof piece === 'string' && piece) {
            got = true;
            onText(piece);
          }
        } catch {
          /* linha incompleta ou de outro tipo */
        }
      }
    }
  } catch {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    throw new AiError(got ? 'failed' : navigator.onLine === false ? 'offline' : 'failed');
  }
  if (!got) throw new AiError('failed');
}
