import { useLibrary } from './state/library';
import { useSettings } from './state/settings';
import { useStudy } from './state/study';
import { applyIncoming, useIncoming } from './state/incoming';

/** Carrega o que está no IndexedDB e acerta a versão em uso. */
export async function boot() {
  await Promise.all([useLibrary.getState().hydrate(), useStudy.getState().hydrate()]);
  const link = useIncoming.getState().incoming;
  if (link && useLibrary.getState().installed[link.versionId]) applyIncoming();
  reconcile();
  // Se a versão em uso some (remoção, limpeza do navegador), passa para outra que ainda esteja instalada.
  useLibrary.subscribe(reconcile);
}

function reconcile() {
  const { installed } = useLibrary.getState();
  const { versionId, set } = useSettings.getState();
  const ids = Object.keys(installed);
  if (ids.length > 0 && !installed[versionId]) set('versionId', ids[0]);
}
