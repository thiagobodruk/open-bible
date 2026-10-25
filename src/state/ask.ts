import { create } from 'zustand';
import { trackFeature } from '../analytics';
import { askAI, AiError, type AiErrorKind, type AiMessage, type AiPassage } from '../ai';

interface AskStore {
  /** A barra de pergunta no rodapé do leitor. */
  bar: boolean;
  toggleBar: () => void;
  openBar: () => void;
  closeBar: () => void;
  passage: AiPassage | null;
  messages: AiMessage[];
  status: 'idle' | 'loading' | 'streaming' | 'error';
  error: AiErrorKind | null;
  /** Começa uma conversa nova sobre o trecho. */
  start: (question: string, passage: AiPassage, lang: string) => void;
  /** Continua a conversa atual. */
  followUp: (question: string, lang: string) => void;
  retry: (lang: string) => void;
  /** Troca a seleção pelo capítulo inteiro nas próximas perguntas. */
  widen: () => void;
  /** Interrompe a resposta em andamento. */
  stop: () => void;
}

/** A resposta só aparece depois disso, para os pontinhos não piscarem. */
const MIN_THINKING = 1000;

let controller: AbortController | undefined;

export const useAsk = create<AskStore>((set, get) => {
  const run = async (history: AiMessage[], question: string, passage: AiPassage, lang: string) => {
    controller?.abort();
    const c = new AbortController();
    controller = c;
    set({ passage, messages: [...history, { role: 'user', content: question }, { role: 'assistant', content: '' }], status: 'loading', error: null });
    const ready = new Promise<void>((resolve) => setTimeout(resolve, MIN_THINKING));
    let queue = ready;
    try {
      await askAI({
        question,
        passage,
        lang,
        history,
        signal: c.signal,
        onText: (chunk) => {
          queue = queue.then(() => {
            if (c.signal.aborted) return;
            set((s) => {
              const messages = s.messages.slice();
              const last = messages[messages.length - 1];
              messages[messages.length - 1] = { ...last, content: last.content + chunk };
              return { messages, status: 'streaming' };
            });
          });
        },
      });
      await queue;
      if (controller === c) set({ status: 'idle' });
    } catch (e) {
      await ready;
      if (c.signal.aborted) return;
      set({ status: 'error', error: e instanceof AiError ? e.kind : 'failed' });
    }
  };

  return {
    bar: false,
    toggleBar: () => set((s) => ({ bar: !s.bar })),
    openBar: () => set({ bar: true }),
    closeBar: () => set({ bar: false }),
    passage: null,
    messages: [],
    status: 'idle',
    error: null,
    start: (question, passage, lang) => {
      trackFeature('ask');
      void run([], question, passage, lang);
    },
    followUp: (question, lang) => {
      const { passage, messages, status } = get();
      if (!passage || status === 'loading' || status === 'streaming') return;
      void run(messages, question, passage, lang);
    },
    retry: (lang) => {
      const { passage, messages } = get();
      const asked = messages[messages.length - 2];
      if (!passage || asked?.role !== 'user') return;
      void run(messages.slice(0, -2), asked.content, passage, lang);
    },
    widen: () => {
      const { passage } = get();
      if (passage?.wide) set({ passage: { ref: passage.wide.ref, version: passage.version, text: passage.wide.text } });
    },
    stop: () => {
      controller?.abort();
      controller = undefined;
      set((s) => (s.status === 'loading' || s.status === 'streaming' ? { status: 'idle' } : {}));
    },
  };
});
