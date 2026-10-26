// Sincronização com o Firestore: notas, marcações, posição de leitura e ajustes de quem entrou com o Google.
// O aparelho continua sendo a fonte de leitura: tudo funciona offline e as mudanças vão para a nuvem quando houver rede.
// Em cada item vale o mais recente (updatedAt). Itens apagados viram marcadores (`deleted`) para a exclusão chegar aos outros aparelhos.
import type { Firestore } from 'firebase/firestore';
import { dbDelete, dbPut } from './db';
import { savePosition } from './state/position';
import { DEFAULTS, useSettings, type Settings } from './state/settings';
import { useStudy, type Highlight, type Note } from './state/study';
import { getItem, getJson, removeItem, setItem, setJson } from './storage';

type Col = 'notes' | 'highlights';

const DIRTY = 'ob:sync-dirty';
const OWNER = 'ob:sync-uid';
const PREFS_AT = 'ob:sync-prefs-at';
const FLUSH_DELAY = 1500;
const PREFS_DELAY = 3000;
const TIMEOUT = 15000;
/** Ajustes de leitura sincronizados. Idioma da interface e versão ficam de fora: dependem do aparelho. */
const PREF_KEYS = ['theme', 'font', 'fontSize', 'lineHeight', 'margins', 'align', 'verseNumbers', 'textMode'] as const satisfies readonly (keyof Settings)[];

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

const stamp = (x: { createdAt: number; updatedAt?: number }) => x.updatedAt ?? x.createdAt;
const dirtyKey = (col: Col, id: string) => `${col}/${id}`;


const withTimeout = <T>(p: Promise<T>) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT))]);

interface Session {
  uid: string;
  db: Firestore;
  fs: typeof import('firebase/firestore');
  /** A primeira busca na nuvem já deu certo. */
  pulled: boolean;
  stop: () => void;
}

let session: Session | null = null;
let applying = false;
let pendingPrefs = false;
let onStatus: (s: SyncStatus) => void = () => undefined;

export function onSyncStatus(cb: (s: SyncStatus) => void) {
  onStatus = cb;
}

const markDirty = (keys: string[]) => {
  if (!keys.length) return;
  const set = new Set(getJson<string[]>(DIRTY, []));
  keys.forEach((k) => set.add(k));
  setJson(DIRTY, [...set]);
};

const touchPrefs = () => setItem(PREFS_AT, String(Date.now()));
const prefsAt = () => Number(getItem(PREFS_AT)) || 0;

/** Liga a sincronização à conta que entrou. Chamar de novo com a mesma conta não faz nada. */
export async function startSync(uid: string) {
  if (session?.uid === uid) return;
  stopSync();
  onStatus('syncing');
  const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
  const db = fs.getFirestore(getApps()[0]);
  const cleanups: (() => void)[] = [];
  let stopped = false;
  const me: Session = {
    uid,
    db,
    fs,
    pulled: false,
    stop: () => {
      stopped = true;
      cleanups.forEach((c) => c());
    },
  };
  session = me;

  // Dados de outra conta que sobraram neste aparelho já estão na nuvem dela: não entram na desta.
  const owner = getItem(OWNER);
  if (owner && owner !== uid) await wipeLocal();
  setItem(OWNER, uid);

  try {
    await pullAll(me);
    if (stopped) return;
    me.pulled = true;
    await flush(me);
  } catch (e) {
    if (stopped) return;
    onStatus(navigator.onLine ? 'error' : 'offline');
    // Sem rede ou com erro, o que ficou pendente segue marcado e sobe quando a conexão voltar.
    watchOnline(me, cleanups);
    watchLocal(me, cleanups);
    throw e;
  }

  watchRemote(me, cleanups);
  watchLocal(me, cleanups);
  watchOnline(me, cleanups);
  onStatus('synced');
}

export function stopSync() {
  session?.stop();
  session = null;
  onStatus('idle');
}

async function wipeLocal() {
  const { highlights, notes } = useStudy.getState();
  applying = true;
  try {
    useStudy.setState({ highlights: {}, notes: [] });
    await Promise.all([dbDelete('highlights', Object.keys(highlights)), dbDelete('notes', notes.map((n) => n.id))]);
  } catch {
    /* o que sobrar é sobrescrito pela mescla */
  } finally {
    applying = false;
  }
  setJson(DIRTY, []);
  removeItem(PREFS_AT);
}

const col = (s: Session, name: string) => s.fs.collection(s.db, 'users', s.uid, name);

interface Remote<T> {
  id: string;
  deleted: boolean;
  at: number;
  data: T | null;
}

function parseRemote(id: string, raw: Record<string, unknown>): Remote<Note | Highlight> {
  const at = typeof raw.updatedAt === 'number' ? raw.updatedAt : 0;
  if (raw.deleted === true) return { id, deleted: true, at, data: null };
  const { deleted: _d, ...data } = raw;
  return { id, deleted: false, at, data: data as unknown as Note | Highlight };
}

/** Traz da nuvem tudo o que é mais novo do que o local e aplica no aparelho. Depois sobe o que só existe aqui ou é mais novo. */
async function pullAll(s: Session) {
  const [notesSnap, hlSnap, prefsSnap] = await withTimeout(
    Promise.all([s.fs.getDocs(col(s, 'notes')), s.fs.getDocs(col(s, 'highlights')), s.fs.getDoc(s.fs.doc(s.db, 'users', s.uid, 'meta', 'prefs'))]),
  );
  const remoteNotes = notesSnap.docs.map((d) => parseRemote(d.id, d.data()));
  const remoteHl = hlSnap.docs.map((d) => parseRemote(d.id, d.data()));
  await applyRemote('notes', remoteNotes);
  await applyRemote('highlights', remoteHl);

  // O que existe só neste aparelho, ou é mais novo que a nuvem, precisa subir.
  const st = useStudy.getState();
  const known = (list: Remote<unknown>[]) => new Map(list.map((r) => [r.id, r]));
  const rn = known(remoteNotes);
  const rh = known(remoteHl);
  const up: string[] = [];
  for (const n of st.notes) if ((rn.get(n.id)?.at ?? -1) < stamp(n)) up.push(dirtyKey('notes', n.id));
  for (const h of Object.values(st.highlights)) if ((rh.get(h.key)?.at ?? -1) < stamp(h)) up.push(dirtyKey('highlights', h.key));
  markDirty(up);

  applyPrefs(prefsSnap.exists() ? (prefsSnap.data() as Record<string, unknown>) : null, true);
}

/** Aplica no aparelho o que veio da nuvem, sem devolver a mudança para lá. */
async function applyRemote(name: Col, items: Remote<Note | Highlight>[]) {
  if (!items.length) return;
  const st = useStudy.getState();
  const dirty = new Set(getJson<string[]>(DIRTY, []));
  const local = name === 'notes' ? new Map<string, Note | Highlight>(st.notes.map((n) => [n.id, n])) : new Map<string, Note | Highlight>(Object.entries(st.highlights));
  const put: (Note | Highlight)[] = [];
  const del: string[] = [];
  for (const r of items) {
    const cur = local.get(r.id);
    // Apagado aqui e ainda não enviado: a exclusão sobe em vez de o item voltar.
    if (!cur && dirty.has(dirtyKey(name, r.id))) continue;
    if (r.deleted) {
      if (cur && stamp(cur) <= r.at) {
        local.delete(r.id);
        del.push(r.id);
      }
    } else if (r.data && (!cur || stamp(cur) < r.at)) {
      local.set(r.id, r.data);
      put.push(r.data);
    }
  }
  if (!put.length && !del.length) return;
  applying = true;
  try {
    if (name === 'notes') useStudy.setState({ notes: [...local.values()] as Note[] });
    else useStudy.setState({ highlights: Object.fromEntries(local) as Record<string, Highlight> });
    if (put.length) await dbPut(name, put).catch(() => undefined);
    if (del.length) await dbDelete(name, del).catch(() => undefined);
  } finally {
    applying = false;
  }
}

function applyPrefs(raw: Record<string, unknown> | null, initial: boolean) {
  const at = raw && typeof raw.updatedAt === 'number' ? raw.updatedAt : 0;
  if (!raw || at <= prefsAt()) {
    // Sem ajustes na nuvem, ou os daqui são mais novos: sobem na próxima sincronização.
    if (initial && (!raw || prefsAt() > at)) pendingPrefs = true;
    return;
  }
  applying = true;
  try {
    const remote = (raw.settings ?? {}) as Partial<Settings>;
    const patch: Partial<Settings> = {};
    for (const k of PREF_KEYS) if (remote[k] !== undefined && typeof remote[k] === typeof DEFAULTS[k]) (patch as Record<string, unknown>)[k] = remote[k];
    useSettings.setState(patch);
    // A posição só muda na abertura: trocar de capítulo no meio da leitura seria um susto.
    const pos = raw.position as { book?: unknown; chapter?: unknown } | undefined;
    if (initial && pos && typeof pos.book === 'string' && Number.isInteger(pos.chapter) && (pos.chapter as number) > 0) {
      savePosition(pos.book, pos.chapter as number);
      useStudy.getState().goTo(pos.book, pos.chapter as number);
    }
    setItem(PREFS_AT, String(at));
  } finally {
    applying = false;
  }
}

/** Envia tudo o que está pendente. Itens que não existem mais viram marcadores de exclusão. */
async function flush(s: Session) {
  if (session !== s || !navigator.onLine) return;
  const dirty = getJson<string[]>(DIRTY, []);
  if (!dirty.length && !pendingPrefs) return;
  onStatus('syncing');
  const st = useStudy.getState();
  const notes = new Map(st.notes.map((n) => [n.id, n]));
  const sent = new Map<string, unknown>();
  const now = Date.now();
  try {
    for (let i = 0; i < dirty.length; i += 400) {
      const batch = s.fs.writeBatch(s.db);
      const chunk = dirty.slice(i, i + 400);
      const part = new Map<string, unknown>();
      for (const k of chunk) {
        const [name, ...rest] = k.split('/');
        const id = rest.join('/');
        const ref = s.fs.doc(s.db, 'users', s.uid, name, id);
        const item = name === 'notes' ? notes.get(id) : st.highlights[id];
        if (item) batch.set(ref, { ...item, updatedAt: stamp(item), deleted: false });
        else batch.set(ref, { deleted: true, updatedAt: now });
        part.set(k, item);
      }
      await withTimeout(batch.commit());
      part.forEach((v, k) => sent.set(k, v));
    }
    if (pendingPrefs) {
      await withTimeout(pushPrefs(s));
      pendingPrefs = false;
    }
    onStatus('synced');
  } catch {
    onStatus(navigator.onLine ? 'error' : 'offline');
  } finally {
    // Só sai da fila o que não mudou durante o envio.
    const cur = useStudy.getState();
    const unchanged = (k: string) => {
      const [name, ...rest] = k.split('/');
      const id = rest.join('/');
      return (name === 'notes' ? cur.notes.find((n) => n.id === id) : cur.highlights[id]) === sent.get(k);
    };
    if (sent.size) setJson(DIRTY, getJson<string[]>(DIRTY, []).filter((k) => !(sent.has(k) && unchanged(k))));
  }
}

function pushPrefs(s: Session) {
  const cfg = useSettings.getState();
  const settings: Record<string, unknown> = {};
  for (const k of PREF_KEYS) settings[k] = cfg[k];
  const { book, chapter } = useStudy.getState();
  return s.fs.setDoc(s.fs.doc(s.db, 'users', s.uid, 'meta', 'prefs'), { settings, position: { book, chapter }, updatedAt: prefsAt() || Date.now() });
}

/** Mudanças feitas neste aparelho: marca o que mudou e agenda o envio. */
function watchLocal(s: Session, cleanups: (() => void)[]) {
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let prefsTimer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flush(s), FLUSH_DELAY);
  };

  const offStudy = useStudy.subscribe((now, prev) => {
    if (applying) return;
    const dirty: string[] = [];
    if (now.notes !== prev.notes) {
      const before = new Map(prev.notes.map((n) => [n.id, n]));
      const after = new Map(now.notes.map((n) => [n.id, n]));
      for (const [id, n] of after) if (before.get(id) !== n) dirty.push(dirtyKey('notes', id));
      for (const id of before.keys()) if (!after.has(id)) dirty.push(dirtyKey('notes', id));
    }
    if (now.highlights !== prev.highlights) {
      for (const [k, h] of Object.entries(now.highlights)) if (prev.highlights[k] !== h) dirty.push(dirtyKey('highlights', k));
      for (const k of Object.keys(prev.highlights)) if (!(k in now.highlights)) dirty.push(dirtyKey('highlights', k));
    }
    if (dirty.length) {
      markDirty(dirty);
      schedule();
    }
    if (now.book !== prev.book || now.chapter !== prev.chapter) queuePrefs();
  });

  const queuePrefs = () => {
    touchPrefs();
    clearTimeout(prefsTimer);
    prefsTimer = setTimeout(() => {
      pendingPrefs = true;
      void flush(s);
    }, PREFS_DELAY);
  };

  const offSettings = useSettings.subscribe((now, prev) => {
    if (applying) return;
    if (PREF_KEYS.some((k) => now[k] !== prev[k])) queuePrefs();
  });

  cleanups.push(offStudy, offSettings, () => {
    clearTimeout(flushTimer);
    clearTimeout(prefsTimer);
  });
}

/** Mudanças vindas de outro aparelho chegam ao vivo enquanto o app está aberto. */
function watchRemote(s: Session, cleanups: (() => void)[]) {
  const listen = (name: Col) =>
    s.fs.onSnapshot(
      col(s, name),
      (snap) => {
        const changes = snap.docChanges().filter((c) => !c.doc.metadata.hasPendingWrites);
        if (!changes.length) return;
        void applyRemote(
          name,
          changes.map((c) => parseRemote(c.doc.id, c.doc.data())),
        );
      },
      () => undefined,
    );
  cleanups.push(
    listen('notes'),
    listen('highlights'),
    s.fs.onSnapshot(
      s.fs.doc(s.db, 'users', s.uid, 'meta', 'prefs'),
      (snap) => {
        if (!snap.metadata.hasPendingWrites && snap.exists()) applyPrefs(snap.data() as Record<string, unknown>, false);
      },
      () => undefined,
    ),
  );
}

function watchOnline(s: Session, cleanups: (() => void)[]) {
  const retry = () => {
    if (s.pulled) return void flush(s);
    // A busca inicial falhou (sem rede): recomeça a sincronização desta conta.
    stopSync();
    void startSync(s.uid).catch(() => undefined);
  };
  addEventListener('online', retry);
  cleanups.push(() => removeEventListener('online', retry));
}
