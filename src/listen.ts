import { create } from 'zustand';
import { useStudy } from './state/study';
import { detectIOS } from './install';
import { getItem, getJson, setItem, setJson } from './storage';

// Leitura em voz alta com as vozes do sistema (Web Speech API). Lê um versículo por vez,
// o que permite destacar o trecho atual e retomar de onde parou.

const KEY = 'ob:listen';

export const RATES = [0.75, 1, 1.25, 1.5] as const;

interface Prefs {
  rate: number;
  /** Identificador da voz escolhida, por prefixo de idioma. */
  voices: Record<string, string>;
  next: boolean;
}

const DEFAULT_PREFS: Prefs = { rate: 1, voices: {}, next: true };

const loadPrefs = (): Prefs => ({ ...DEFAULT_PREFS, ...getJson<Partial<Prefs>>(KEY, {}) });

const savePrefs = (p: Prefs) => setJson(KEY, p);

export const listenSupported = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

// Alguns navegadores só carregam a lista de vozes depois da primeira consulta. Fazer isso na abertura
// evita esperar no toque do usuário, que no iOS precisa iniciar a fala.
if (listenSupported()) speechSynthesis.getVoices();

const base = (lang: string) => lang.toLowerCase().split(/[-_]/)[0];

/** Vozes do sistema para o idioma da versão. */
export function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!listenSupported()) return [];
  const b = base(lang);
  return speechSynthesis.getVoices().filter((v) => base(v.lang) === b);
}

/** Só a voz que a pessoa escolheu. Sem escolha, o sistema usa a voz padrão do idioma: no iOS, algumas vozes
 * listadas não estão baixadas e ficam mudas, e a padrão é a que sabemos que funciona. */
function chosenVoice(lang: string): SpeechSynthesisVoice | undefined {
  const saved = loadPrefs().voices[base(lang)];
  return saved ? voicesFor(lang).find((v) => v.voiceURI === saved) : undefined;
}

type Status = 'idle' | 'playing' | 'paused';

interface ListenStore extends Prefs {
  status: Status;
  /** Versículo em leitura (1 a n). */
  verse: number | null;
  /** O capítulo acabou e o próximo ainda precisa ser carregado para continuar. */
  advancing: boolean;
  setRate: (r: number) => void;
  setVoice: (lang: string, uri: string) => void;
  setNext: (on: boolean) => void;
}

export const useListen = create<ListenStore>((set, get) => ({
  ...loadPrefs(),
  status: 'idle',
  verse: null,
  advancing: false,
  setRate: (rate) => {
    set({ rate });
    savePrefs(pick(get()));
    if (get().status === 'playing') speakAt(get().verse ?? 1);
  },
  setVoice: (lang, uri) => {
    set({ voices: { ...get().voices, [base(lang)]: uri } });
    savePrefs(pick(get()));
    if (get().status === 'playing') speakAt(get().verse ?? 1);
  },
  setNext: (next) => {
    set({ next });
    savePrefs(pick(get()));
  },
}));

const pick = ({ rate, voices, next }: Prefs): Prefs => ({ rate, voices, next });

let verses: string[] = [];
let lang = 'en';
// Cada fala recebe um número; respostas de falas canceladas são ignoradas.
let token = 0;
/** Chamado quando uma fala não começa. Definido pela interface para mostrar o aviso. */
let onSilent: (() => void) | undefined;
export function setSilentHandler(fn: () => void) {
  onSilent = fn;
}
// O navegador pode coletar a fala em curso se ninguém guardar a referência.
let current: SpeechSynthesisUtterance | null = null;

function speakAt(n: number) {
  const token0 = ++token;
  if (n > verses.length) return finishChapter();
  // Chamar speak() logo depois de cancel() faz iOS e Chrome engolirem a fala. Só cancela se há algo em curso
  // e, nesse caso, dá um instante antes de falar de novo. O primeiro toque fala na hora, ainda dentro do gesto.
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    setTimeout(() => {
      if (token0 === token) say(n, token0);
    }, 80);
  } else say(n, token0);
}

function say(n: number, token0: number) {
  const u = new SpeechSynthesisUtterance(verses[n - 1]);
  u.lang = lang;
  u.rate = useListen.getState().rate;
  const voice = chosenVoice(lang);
  if (voice) u.voice = voice;
  // Se a fala não começa, quase sempre é o botão de silêncio ou uma voz sem áudio: avisa em vez de ficar mudo.
  const silent = setTimeout(() => {
    if (token0 === token) onSilent?.();
  }, 4000);
  u.onstart = () => clearTimeout(silent);
  u.onend = () => {
    clearTimeout(silent);
    if (token0 === token) speakAt(n + 1);
  };
  u.onerror = () => {
    clearTimeout(silent);
    if (token0 === token) stop();
  };
  current = u;
  useListen.setState({ status: 'playing', verse: n, advancing: false });
  // No iOS o sintetizador pode ficar preso em pausa depois de um cancel.
  speechSynthesis.resume();
  speechSynthesis.speak(u);
}

function finishChapter() {
  if (useListen.getState().next && useStudy.getState().step(1)) {
    // O Reader retoma a leitura quando o texto do próximo capítulo chegar.
    useListen.setState({ advancing: true });
    scrollTo(0, 0);
  } else stop();
}

/** Começa a ler. Devolve falso quando não há voz para o idioma. */
export function start(text: string[], language: string, from = 1): boolean {
  if (!listenSupported() || text.length === 0) return false;
  if (voicesFor(language).length === 0) return false;
  verses = text;
  lang = language;
  speakAt(from);
  return true;
}

/** Continua a leitura no capítulo recém-aberto. */
export function resume(text: string[], language: string) {
  start(text, language, 1);
}

export function pause() {
  if (useListen.getState().status !== 'playing') return;
  token++;
  speechSynthesis.cancel();
  useListen.setState({ status: 'paused' });
}

export function play() {
  const { status, verse } = useListen.getState();
  if (status === 'paused') speakAt(verse ?? 1);
}

export function stop() {
  token++;
  if (listenSupported()) speechSynthesis.cancel();
  if (current) current.onend = current.onerror = null;
  current = null;
  useListen.setState({ status: 'idle', verse: null, advancing: false });
}


const HINT_KEY = 'ob:listen-hint';

/** No iOS o botão de silêncio cala a fala e o app não tem como saber. Avisa uma única vez, antes da primeira leitura. */
export function silentHintDue(): boolean {
  if (!detectIOS()) return false;
  return !getItem(HINT_KEY, '1');
}

export function markSilentHintSeen() {
  setItem(HINT_KEY, '1');
}
