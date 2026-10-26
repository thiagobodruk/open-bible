import { create } from 'zustand';
import type { Auth, User } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config';
import { track } from '../analytics';
import { savedAcceptance } from './terms';
import { onSyncStatus, startSync, stopSync, type SyncStatus } from '../sync';
import { getItem, getJson, removeItem, setItem, setJson } from '../storage';

export interface Profile {
  name: string;
  photo: string | null;
}

export type SignInResult = 'ok' | 'restored' | 'cancelled' | 'offline' | 'failed';

/** Último perfil conhecido, para o menu já abrir com a conta certa, mesmo offline. */
const KEY = 'ob:account';
/** Marca a ida ao Google por redirecionamento, para o Firebase carregar na volta. */
const REDIRECT = 'ob:auth-redirect';

export const accountAvailable = () => firebaseConfig !== null;

function savedProfile(): Profile | null {
  const p = getJson<{ name?: unknown; photo?: unknown } | null>(KEY, null);
  return p && typeof p.name === 'string' ? { name: p.name, photo: typeof p.photo === 'string' ? p.photo : null } : null;
}

function saveProfile(p: Profile | null) {
  if (p) setJson(KEY, p);
  else removeItem(KEY);
}

const profileOf = (u: User | null): Profile | null => (u ? { name: u.displayName ?? u.email ?? '', photo: u.photoURL } : null);

interface Loaded {
  auth: Auth;
  mod: typeof import('firebase/auth');
}

let loading: Promise<Loaded> | null = null;

/** Carrega o Firebase só quando alguém precisa dele, para não pesar na primeira abertura. */
export function warmAccount(): Promise<Loaded> {
  if (!loading) {
    loading = (async () => {
      const [{ getApps, initializeApp }, mod] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
      const auth = mod.getAuth(getApps()[0] ?? initializeApp(firebaseConfig!));
      mod.onAuthStateChanged(auth, (u) => {
        const profile = profileOf(u);
        saveProfile(profile);
        useAccount.setState({ user: profile });
        if (u) {
          void saveAcceptance(u.uid);
          void startSync(u.uid).catch(() => undefined);
        }
        else stopSync();
      });
      return { auth, mod };
    })();
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/** Grava no Firestore o aceite dos termos feito neste aparelho, uma vez por conta. Falhar aqui não impede o login. */
async function saveAcceptance(uid: string) {
  const a = savedAcceptance();
  const mark = `ob:terms-synced:${uid}`;
  try {
    if (!a || getItem(mark) === a.version) return;
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    await fs.setDoc(fs.doc(fs.getFirestore(getApps()[0]), 'users', uid), { terms: { version: a.version, acceptedAt: a.at } }, { merge: true });
    setItem(mark, a.version);
  } catch {
    /* tenta de novo no próximo login */
  }
}

/** Tira a marca de exclusão de uma conta que volta a entrar. Falhar aqui não impede o login. */
async function restoreIfDeleted(uid: string): Promise<boolean> {
  try {
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    const ref = fs.doc(fs.getFirestore(getApps()[0]), 'users', uid);
    if (!(await fs.getDoc(ref)).data()?.deletedAt) return false;
    await fs.updateDoc(ref, { deletedAt: fs.deleteField() });
    return true;
  } catch {
    return false;
  }
}

const codeOf = (e: unknown) => (e as { code?: string })?.code ?? '';

interface AccountStore {
  user: Profile | null;
  sync: SyncStatus;
  busy: boolean;
  signIn: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Exclusão suave: marca `users/{uid}.deletedAt` no Firestore e sai. A remoção definitiva dos dados é feita depois. */
  deleteAccount: () => Promise<void>;
}

export const useAccount = create<AccountStore>((set) => ({
  user: accountAvailable() ? savedProfile() : null,
  sync: 'idle',
  busy: false,
  signIn: async () => {
    set({ busy: true });
    try {
      const { auth, mod } = await warmAccount();
      const provider = new mod.GoogleAuthProvider();
      try {
        const { user } = await mod.signInWithPopup(auth, provider);
        track('sign_in', { method: 'google' });
        if (await restoreIfDeleted(user.uid)) return 'restored';
      } catch (e) {
        // Alguns navegadores e PWAs instalados não abrem popup. Nesses casos o login segue por redirecionamento.
        if (codeOf(e) !== 'auth/popup-blocked' && codeOf(e) !== 'auth/operation-not-supported-in-this-environment') throw e;
        try {
          sessionStorage.setItem(REDIRECT, '1');
        } catch {
          /* sem a marca, o Firebase carrega na próxima abertura */
        }
        await mod.signInWithRedirect(auth, provider);
      }
      return 'ok';
    } catch (e) {
      const code = codeOf(e);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'cancelled';
      if (code === 'auth/network-request-failed' || !navigator.onLine) return 'offline';
      return 'failed';
    } finally {
      set({ busy: false });
    }
  },
  signOut: async () => {
    const { auth, mod } = await warmAccount();
    await mod.signOut(auth);
  },
  deleteAccount: async () => {
    const { auth, mod } = await warmAccount();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('not_signed_in');
    const [{ getApps }, fs] = await Promise.all([import('firebase/app'), import('firebase/firestore')]);
    await fs.setDoc(fs.doc(fs.getFirestore(getApps()[0]), 'users', uid), { deletedAt: fs.serverTimestamp() }, { merge: true });
    await mod.signOut(auth);
  },
}));

onSyncStatus((sync) => useAccount.setState({ sync }));

/** Na abertura, só carrega o Firebase de quem já tem conta ou acabou de voltar do login por redirecionamento. */
export function initAccount() {
  if (!accountAvailable()) return;
  let redirected = false;
  try {
    redirected = sessionStorage.getItem(REDIRECT) === '1';
    sessionStorage.removeItem(REDIRECT);
  } catch {
    /* segue sem a marca */
  }
  if (redirected || savedProfile()) void warmAccount().catch(() => undefined);
}
