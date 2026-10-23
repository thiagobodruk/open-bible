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

/** A versão nova espera em segundo plano e entra quando o app sai de cena, sem interromper a leitura. */
export function initUpdates() {
  document.addEventListener('visibilitychange', () => {
    if (waiting && document.visibilityState === 'hidden') activate();
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
