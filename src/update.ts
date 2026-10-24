import { registerSW } from 'virtual:pwa-register';

let registration: ServiceWorkerRegistration | undefined;
let waiting = false;

const apply = registerSW({
  onNeedRefresh() {
    waiting = true;
  },
  onRegisteredSW(_url, r) {
    registration = r;
  },
});

/** Ativa o worker que está esperando e recarrega quando ele assume a página. */
function activate() {
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  void apply(false);
}

const RECHECK = 10 * 60 * 1000;
let lastCheck = Date.now();

/**
 * A versão nova espera em segundo plano e entra quando o app sai de cena, sem interromper a leitura.
 * Ao voltar para o app, busca uma versão nova (no máximo a cada 10 minutos), que entrará na próxima saída.
 */
export function initUpdates() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (waiting) activate();
    } else if (!waiting && registration && Date.now() - lastCheck > RECHECK) {
      lastCheck = Date.now();
      registration.update().catch(() => {});
    }
  });
}

export type UpdateResult = 'updating' | 'latest' | 'offline';

const TIMEOUT = 20000;

/** Espera o worker chegar a um dos estados, ou desiste no tempo limite. */
const until = (w: ServiceWorker, states: ServiceWorkerState[]) =>
  new Promise<void>((resolve) => {
    if (states.includes(w.state)) return resolve();
    w.addEventListener('statechange', () => states.includes(w.state) && resolve());
    setTimeout(resolve, TIMEOUT);
  });

/** Busca uma versão nova agora e, se houver, aplica e recarrega a página. */
export async function checkForUpdate(): Promise<UpdateResult> {
  if (waiting) {
    activate();
    return 'updating';
  }
  if (!registration) return 'latest';
  const before = registration.active;
  let found: ServiceWorker | null = null;
  try {
    await registration.update();
    found = registration.installing;
    if (found) await until(found, ['installed', 'activated', 'redundant']);
  } catch {
    return 'offline';
  }
  if (registration.waiting) {
    activate();
    return 'updating';
  }
  // O worker novo já assumiu sozinho (por exemplo, na primeira sessão): basta recarregar.
  if (registration.active !== before) {
    location.reload();
    return 'updating';
  }
  return 'latest';
}

export interface BuildInfo {
  version: string;
  build: string;
}

export const currentBuild: BuildInfo = { version: __APP_VERSION__, build: __APP_BUILD__ };

/** "1.0.0 (a1b2c3d)" */
export const buildLabel = (b: BuildInfo) => `v${b.version} (${b.build})`;

/** O que está publicado agora. Nulo sem conexão ou fora do site publicado. */
export async function fetchLatestBuild(): Promise<BuildInfo | null> {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: 'no-store' });
    if (!r.ok) return null;
    const j = (await r.json()) as Partial<BuildInfo>;
    return typeof j.version === 'string' && typeof j.build === 'string' ? { version: j.version, build: j.build } : null;
  } catch {
    return null;
  }
}
