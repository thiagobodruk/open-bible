import { getItem, removeItem, setItem } from './storage';
import { useUI } from './state/ui';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const flag = (key: string) => !!getItem(key);
const setFlag = (key: string) => setItem(key, '1');
const clearFlag = removeItem;

const INSTALLED = 'ob:installed';
const DISMISSED = 'ob:install-dismissed';

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as InstallPromptEvent;
  // O navegador só oferece a instalação quando o app não está instalado: se a marca sobrou, ele foi desinstalado.
  clearFlag(INSTALLED);
  emit();
});

addEventListener('appinstalled', () => {
  deferred = null;
  setFlag(INSTALLED);
  emit();
});

/** Para `useSyncExternalStore`: avisa quando o prompt nativo fica disponível ou deixa de estar. */
export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** O navegador liberou o prompt nativo de instalação (Android, Chrome e Edge no desktop). */
export const canPromptInstall = () => deferred !== null;

/** Dispara o prompt nativo (Android/Chrome). Retorna false se não houver, e aí mostramos o guia manual. */
export async function requestInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  deferred = null;
  emit();
  // O navegador pode tomar o endereço atual como página inicial: durante a instalação ele aponta para a raiz.
  useUI.getState().setHomeUrl(true);
  history.replaceState(history.state, '', import.meta.env.BASE_URL);
  try {
    await ev.prompt();
  } finally {
    useUI.getState().setHomeUrl(false);
  }
  return true;
}

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export interface IosInfo {
  device: 'iPhone' | 'iPad';
  browser: 'safari' | 'chrome' | 'other';
}

/** iPhone ou iPad e o navegador, pelo user-agent. No iPadOS o Safari se apresenta como Mac, então conta também o toque. */
export function detectIOS(ua: string = navigator.userAgent, touchPoints: number = navigator.maxTouchPoints): IosInfo | null {
  const phone = /iPhone|iPod/.test(ua);
  const pad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  if (!phone && !pad) return null;
  const browser = /CriOS/.test(ua) ? 'chrome' : /FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|GSA\//.test(ua) ? 'other' : /Safari\//.test(ua) ? 'safari' : 'other';
  return { device: phone ? 'iPhone' : 'iPad', browser };
}

export const isIOS = () => detectIOS() !== null;

/** Celular ou tablet: o toque é o ponteiro principal. No desktop não há dica de gesto nem convite de instalação. */
export const isMobile = () => matchMedia('(pointer: coarse)').matches || isIOS() || /Android/i.test(navigator.userAgent);

let dismissedNow = false;

/** O app já está instalado: aberto como app (standalone) ou instalado por este navegador. No iOS só o primeiro caso é detectável. */
export const isInstalled = () => isStandalone() || flag(INSTALLED);

/** Vale mostrar qualquer entrada de instalação (item de menu, linha em Ajustes): aparelho móvel e ainda não instalado. */
export const installAvailable = () => isMobile() && !isInstalled();

/** O convite de instalação (banner) deve aparecer: não instalado e ainda não dispensado nem aberto o guia. */
export const installOffered = () => installAvailable() && !dismissedNow && !flag(DISMISSED);

/** Esconde o banner para sempre, por dispensa ou por já ter aberto o guia de instalação. */
export function dismissInstall() {
  dismissedNow = true;
  setFlag(DISMISSED);
  emit();
}
